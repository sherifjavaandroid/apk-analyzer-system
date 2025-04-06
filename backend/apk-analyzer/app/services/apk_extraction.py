# backend/apk-analyzer/app/services/apk_extraction.py
import os
import zipfile
import xml.etree.ElementTree as ET
import logging
import subprocess
import tempfile
import json
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

def extract_apk_info(apk_path: str) -> Dict[str, Any]:
    """
    Extract basic information from an APK file.

    Args:
        apk_path: Path to the APK file

    Returns:
        Dictionary containing extracted APK information
    """
    result = {
        "package_name": None,
        "version_name": None,
        "version_code": None,
        "min_sdk_version": None,
        "target_sdk_version": None,
        "permissions": [],
        "activities": [],
        "services": [],
        "receivers": [],
        "providers": [],
        "file_size": os.path.getsize(apk_path),
        "dex_files": [],
        "resources": {
            "layouts": 0,
            "drawables": 0,
            "raw": 0,
            "values": 0,
            "animations": 0,
        },
        "libraries": [],
        "assets": [],
        "icon": None,
    }

    # Create a temporary directory for extraction
    temp_dir = tempfile.mkdtemp()

    try:
        # Extract the APK (it's a ZIP file)
        with zipfile.ZipFile(apk_path, 'r') as apk_zip:
            # List all files in the APK
            file_list = apk_zip.namelist()

            # Extract AndroidManifest.xml
            try:
                apk_zip.extract('AndroidManifest.xml', temp_dir)
                manifest_path = os.path.join(temp_dir, 'AndroidManifest.xml')

                # Use aapt to decode the binary AndroidManifest.xml
                try:
                    aapt_process = subprocess.run(
                        ['aapt', 'dump', 'xmltree', apk_path, 'AndroidManifest.xml'],
                        capture_output=True,
                        text=True,
                        check=True
                    )
                    # Parse the aapt output to get manifest information
                    manifest_info = _parse_aapt_output(aapt_process.stdout)
                    result.update(manifest_info)
                except (subprocess.SubprocessError, FileNotFoundError) as e:
                    logger.warning(f"Failed to parse AndroidManifest.xml with aapt: {e}")
                    # Fallback: Try direct parsing (may not work for binary XML)
                    _parse_manifest_directly(manifest_path, result)
            except (KeyError, ET.ParseError) as e:
                logger.warning(f"Failed to extract or parse AndroidManifest.xml: {e}")

            # Count DEX files
            result["dex_files"] = [f for f in file_list if f.endswith('.dex')]

            # Analyze resource files
            for file_path in file_list:
                # Count resource types
                if file_path.startswith('res/layout'):
                    result["resources"]["layouts"] += 1
                elif file_path.startswith('res/drawable') or file_path.startswith('res/mipmap'):
                    result["resources"]["drawables"] += 1
                elif file_path.startswith('res/raw'):
                    result["resources"]["raw"] += 1
                elif file_path.startswith('res/values'):
                    result["resources"]["values"] += 1
                elif file_path.startswith('res/anim') or file_path.startswith('res/animator'):
                    result["resources"]["animations"] += 1

                # Detect native libraries
                if file_path.startswith('lib/') and (file_path.endswith('.so') or file_path.endswith('.dll')):
                    library_name = os.path.basename(file_path)
                    arch = file_path.split('/')[1]  # lib/arm64-v8a/libexample.so -> arm64-v8a
                    result["libraries"].append({
                        "name": library_name,
                        "architecture": arch,
                        "path": file_path
                    })

                # List assets
                if file_path.startswith('assets/') and len(file_path) > 7:  # Skip empty "assets/" entry
                    result["assets"].append(file_path)

            # Try to find the application icon
            if result.get("package_name"):
                icon_files = [f for f in file_list if 'ic_launcher' in f and f.startswith('res/')]
                if icon_files:
                    result["icon"] = icon_files[0]

        # Run additional analysis for framework detection
        result["frameworks"] = _detect_frameworks(apk_path, file_list, temp_dir)

    except Exception as e:
        logger.error(f"Error extracting APK info: {e}")
    finally:
        # Clean up
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except Exception as e:
            logger.warning(f"Failed to clean up temporary directory: {e}")

    return result

def _parse_aapt_output(aapt_output: str) -> Dict[str, Any]:
    """Parse the output from aapt dump xmltree command."""
    result = {
        "package_name": None,
        "version_name": None,
        "version_code": None,
        "min_sdk_version": None,
        "target_sdk_version": None,
        "permissions": [],
        "activities": [],
        "services": [],
        "receivers": [],
        "providers": [],
    }

    lines = aapt_output.splitlines()

    package_line = None
    in_manifest = False
    in_application = False

    for line in lines:
        # Package information is in the manifest element
        if 'manifest' in line.lower() and 'E: manifest' in line:
            in_manifest = True
        elif in_manifest and 'A: package=' in line:
            # Extract package name from: A: package="com.example.app" (Raw: "com.example.app")
            package_match = line.split('package="')[1].split('"')[0]
            result["package_name"] = package_match
        elif in_manifest and 'A: android:versionName=' in line:
            # Extract version name from: A: android:versionName="1.0" (Raw: "1.0")
            version_match = line.split('versionName="')[1].split('"')[0]
            result["version_name"] = version_match
        elif in_manifest and 'A: android:versionCode=' in line:
            # Extract version code from: A: android:versionCode="1" (Raw: "1")
            version_code = line.split('versionCode="')[1].split('"')[0]
            try:
                result["version_code"] = int(version_code)
            except ValueError:
                result["version_code"] = version_code
        elif 'uses-sdk' in line:
            # Look for SDK versions in the following lines
            sdk_section = True
        elif 'A: android:minSdkVersion=' in line:
            # Extract minSdkVersion: A: android:minSdkVersion="21" (Raw: "21")
            try:
                min_sdk = line.split('minSdkVersion="')[1].split('"')[0]
                result["min_sdk_version"] = int(min_sdk)
            except (IndexError, ValueError):
                pass
        elif 'A: android:targetSdkVersion=' in line:
            # Extract targetSdkVersion: A: android:targetSdkVersion="30" (Raw: "30")
            try:
                target_sdk = line.split('targetSdkVersion="')[1].split('"')[0]
                result["target_sdk_version"] = int(target_sdk)
            except (IndexError, ValueError):
                pass
        elif 'E: uses-permission' in line:
            # Look for permission in the next line
            next_line_index = lines.index(line) + 1
            if next_line_index < len(lines) and 'A: android:name=' in lines[next_line_index]:
                perm_line = lines[next_line_index]
                perm_name = perm_line.split('name="')[1].split('"')[0]
                if perm_name not in result["permissions"]:
                    result["permissions"].append(perm_name)

        # Extract components (activities, services, etc.)
        elif 'E: application' in line:
            in_application = True
        elif in_application and 'E: activity' in line:
            # Process activity
            activity_name = _extract_component_name(lines, lines.index(line))
            if activity_name and activity_name not in result["activities"]:
                result["activities"].append(activity_name)
        elif in_application and 'E: service' in line:
            # Process service
            service_name = _extract_component_name(lines, lines.index(line))
            if service_name and service_name not in result["services"]:
                result["services"].append(service_name)
        elif in_application and 'E: receiver' in line:
            # Process receiver
            receiver_name = _extract_component_name(lines, lines.index(line))
            if receiver_name and receiver_name not in result["receivers"]:
                result["receivers"].append(receiver_name)
        elif in_application and 'E: provider' in line:
            # Process provider
            provider_name = _extract_component_name(lines, lines.index(line))
            if provider_name and provider_name not in result["providers"]:
                result["providers"].append(provider_name)

    return result

def _extract_component_name(lines: List[str], start_index: int) -> Optional[str]:
    """Extract component name from aapt output lines."""
    # Look for the name attribute in the next few lines
    for i in range(start_index + 1, min(start_index + 10, len(lines))):
        if 'A: android:name=' in lines[i]:
            name_line = lines[i]
            try:
                return name_line.split('name="')[1].split('"')[0]
            except IndexError:
                return None
    return None

def _parse_manifest_directly(manifest_path: str, result: Dict[str, Any]):
    """
    Direct parsing of AndroidManifest.xml as a fallback.
    Note: This often won't work for APKs as the manifest is in binary format.
    """
    try:
        tree = ET.parse(manifest_path)
        root = tree.getroot()

        # Extract namespace
        ns = ''
        if '}' in root.tag:
            ns = root.tag.split('}')[0] + '}'

        # Get package name
        if 'package' in root.attrib:
            result["package_name"] = root.attrib['package']

        # Get version info
        if f'{ns}versionName' in root.attrib:
            result["version_name"] = root.attrib[f'{ns}versionName']
        if f'{ns}versionCode' in root.attrib:
            try:
                result["version_code"] = int(root.attrib[f'{ns}versionCode'])
            except ValueError:
                result["version_code"] = root.attrib[f'{ns}versionCode']

        # Get SDK info
        sdk_element = root.find(f'.//{ns}uses-sdk')
        if sdk_element is not None:
            if f'{ns}minSdkVersion' in sdk_element.attrib:
                try:
                    result["min_sdk_version"] = int(sdk_element.attrib[f'{ns}minSdkVersion'])
                except ValueError:
                    pass
            if f'{ns}targetSdkVersion' in sdk_element.attrib:
                try:
                    result["target_sdk_version"] = int(sdk_element.attrib[f'{ns}targetSdkVersion'])
                except ValueError:
                    pass

        # Get permissions
        for perm_elem in root.findall(f'.//{ns}uses-permission'):
            if f'{ns}name' in perm_elem.attrib:
                perm_name = perm_elem.attrib[f'{ns}name']
                if perm_name not in result["permissions"]:
                    result["permissions"].append(perm_name)

        # Get components
        app_elem = root.find(f'.//{ns}application')
        if app_elem is not None:
            # Activities
            for activity_elem in app_elem.findall(f'.//{ns}activity'):
                if f'{ns}name' in activity_elem.attrib:
                    activity_name = activity_elem.attrib[f'{ns}name']
                    if activity_name not in result["activities"]:
                        result["activities"].append(activity_name)

            # Services
            for service_elem in app_elem.findall(f'.//{ns}service'):
                if f'{ns}name' in service_elem.attrib:
                    service_name = service_elem.attrib[f'{ns}name']
                    if service_name not in result["services"]:
                        result["services"].append(service_name)

            # Receivers
            for receiver_elem in app_elem.findall(f'.//{ns}receiver'):
                if f'{ns}name' in receiver_elem.attrib:
                    receiver_name = receiver_elem.attrib[f'{ns}name']
                    if receiver_name not in result["receivers"]:
                        result["receivers"].append(receiver_name)

            # Providers
            for provider_elem in app_elem.findall(f'.//{ns}provider'):
                if f'{ns}name' in provider_elem.attrib:
                    provider_name = provider_elem.attrib[f'{ns}name']
                    if provider_name not in result["providers"]:
                        result["providers"].append(provider_name)

    except Exception as e:
        logger.warning(f"Error in direct manifest parsing: {e}")

def _detect_frameworks(apk_path: str, file_list: List[str], temp_dir: str) -> Dict[str, Any]:
    """
    Detect which frameworks were used to build the app.
    """
    frameworks = {
        "flutter": False,
        "react_native": False,
        "cordova": False,
        "xamarin": False,
        "unity": False,
        "native_android": False,
        "details": {}
    }

    # Check for Flutter
    flutter_indicators = [
        'assets/flutter_assets/',
        'lib/libflutter.so',
        'lib/arm64-v8a/libflutter.so',
        'lib/armeabi-v7a/libflutter.so'
    ]
    if any(indicator in file_list for indicator in flutter_indicators):
        frameworks["flutter"] = True
        frameworks["details"]["flutter"] = {
            "evidence": [f for f in flutter_indicators if any(f in file_path for file_path in file_list)],
            "confidence": "high"
        }

    # Check for React Native
    react_indicators = [
        'assets/node_modules/react-native/',
        'lib/arm64-v8a/libreactnativejni.so',
        'lib/armeabi-v7a/libreactnativejni.so',
        'assets/index.android.bundle'
    ]
    if any(indicator in file_list for indicator in react_indicators):
        frameworks["react_native"] = True
        frameworks["details"]["react_native"] = {
            "evidence": [f for f in react_indicators if any(f in file_path for file_path in file_list)],
            "confidence": "high"
        }

    # Check for Cordova/PhoneGap
    cordova_indicators = [
        'assets/www/cordova.js',
        'assets/www/plugins/cordova',
        'assets/www/index.html'
    ]
    if any(indicator in file_list for indicator in cordova_indicators):
        frameworks["cordova"] = True
        frameworks["details"]["cordova"] = {
            "evidence": [f for f in cordova_indicators if any(f in file_path for file_path in file_list)],
            "confidence": "high"
        }

    # Check for Xamarin
    xamarin_indicators = [
        'assemblies/Xamarin.',
        'lib/arm64-v8a/libmonodroid.so',
        'lib/armeabi-v7a/libmonodroid.so',
        'lib/arm64-v8a/libxamarin-app.so'
    ]
    if any(indicator in file_list for indicator in xamarin_indicators):
        frameworks["xamarin"] = True
        frameworks["details"]["xamarin"] = {
            "evidence": [f for f in xamarin_indicators if any(f in file_path for file_path in file_list)],
            "confidence": "high"
        }

    # Check for Unity
    unity_indicators = [
        'assets/bin/Data/',
        'lib/arm64-v8a/libunity.so',
        'lib/armeabi-v7a/libunity.so',
        'assets/UnityCache/'
    ]
    if any(indicator in file_list for indicator in unity_indicators):
        frameworks["unity"] = True
        frameworks["details"]["unity"] = {
            "evidence": [f for f in unity_indicators if any(f in file_path for file_path in file_list)],
            "confidence": "high"
        }

    # If none of the above frameworks were detected, it's likely native Android
    if not any([frameworks["flutter"], frameworks["react_native"],
                frameworks["cordova"], frameworks["xamarin"], frameworks["unity"]]):
        frameworks["native_android"] = True
        native_indicators = []

        # Check for Kotlin
        kotlin_indicators = [f for f in file_list if 'kotlin' in f.lower()]
        if kotlin_indicators:
            native_indicators.append("kotlin")
            frameworks["details"]["kotlin"] = {
                "evidence": kotlin_indicators[:5],  # First 5 matches
                "confidence": "medium"
            }

        # Check for Java (common in most Android apps)
        java_indicators = [f for f in file_list if 'classes.dex' in f]
        if java_indicators:
            native_indicators.append("java")

        frameworks["details"]["native_android"] = {
            "language": native_indicators,
            "confidence": "medium" if native_indicators else "low"
        }

    return frameworks
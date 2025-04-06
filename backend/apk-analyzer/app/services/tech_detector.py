# backend/apk-analyzer/app/services/tech_detector.py
import os
import re
import zipfile
import tempfile
import subprocess
import logging
from typing import Dict, List, Any, Optional, Set
import shutil

logger = logging.getLogger(__name__)

def detect_technology(apk_path: str) -> Dict[str, Any]:
    """
    Detect technologies used in the APK.

    Args:
        apk_path: Path to the APK file

    Returns:
        Dictionary containing technology detection results
    """
    results = {
        "frameworks": {
            "detected": [],
            "details": {}
        },
        "libraries": {
            "detected": [],
            "details": {}
        },
        "ui_toolkit": {
            "detected": None,
            "details": {}
        },
        "programming_languages": {
            "detected": [],
            "details": {}
        },
        "backend_technologies": {
            "detected": [],
            "details": {}
        },
        "analytics_services": {
            "detected": [],
            "details": {}
        },
        "ad_networks": {
            "detected": [],
            "details": {}
        }
    }

    # Create a temporary directory for extraction
    temp_dir = tempfile.mkdtemp()

    try:
        # Extract the APK
        with zipfile.ZipFile(apk_path, 'r') as apk_zip:
            # Get file list
            file_list = apk_zip.namelist()

            # Extract all files
            apk_zip.extractall(temp_dir)

            # Analyze main frameworks
            detect_frameworks(temp_dir, file_list, results)

            # Analyze libraries
            detect_libraries(temp_dir, file_list, results)

            # Analyze UI toolkit
            detect_ui_toolkit(temp_dir, file_list, results)

            # Analyze programming languages
            detect_programming_languages(temp_dir, file_list, results)

            # Analyze backend technologies
            detect_backend_technologies(temp_dir, file_list, results)

            # Analyze analytics services
            detect_analytics_services(temp_dir, file_list, results)

            # Analyze ad networks
            detect_ad_networks(temp_dir, file_list, results)

    except Exception as e:
        logger.error(f"Error in technology detection: {e}")
    finally:
        # Clean up
        try:
            shutil.rmtree(temp_dir)
        except Exception as e:
            logger.warning(f"Failed to clean up temporary directory: {e}")

    return results

def detect_frameworks(temp_dir: str, file_list: List[str], results: Dict[str, Any]):
    """Detect main app frameworks."""
    framework_indicators = {
        "Flutter": {
            "patterns": [
                "libflutter.so",
                "flutter_assets/",
                "io/flutter/",
                "flutter.jar"
            ],
            "confidence": 0
        },
        "React Native": {
            "patterns": [
                "libreactnativejni.so",
                "com/facebook/react/",
                "ReactNative",
                "index.android.bundle"
            ],
            "confidence": 0
        },
        "Xamarin": {
            "patterns": [
                "libmonodroid.so",
                "libxamarin",
                "Mono.Android.dll",
                "Xamarin"
            ],
            "confidence": 0
        },
        "Cordova/PhoneGap": {
            "patterns": [
                "assets/www/cordova.js",
                "org/apache/cordova/",
                "CordovaActivity",
                "phonegap"
            ],
            "confidence": 0
        },
        "Unity": {
            "patterns": [
                "libunity.so",
                "UnityPlayer",
                "com/unity",
                "unity3d.player"
            ],
            "confidence": 0
        },
        "Native Android": {
            "patterns": [
                "activity_main.xml",
                "fragment_",
                "R$layout",
                "AppCompatActivity"
            ],
            "confidence": 0
        }
    }

    # Check each file against framework patterns
    for file_path in file_list:
        for framework, data in framework_indicators.items():
            for pattern in data["patterns"]:
                if pattern.lower() in file_path.lower():
                    data["confidence"] += 1

    # Determine detected frameworks (threshold = 2 pattern matches)
    detected_frameworks = []
    for framework, data in framework_indicators.items():
        if data["confidence"] >= 2:
            detected_frameworks.append({
                "name": framework,
                "confidence": min(100, data["confidence"] * 25)  # Scale confidence to 0-100
            })

    # Sort by confidence level
    detected_frameworks.sort(key=lambda x: x["confidence"], reverse=True)

    results["frameworks"]["detected"] = [fw["name"] for fw in detected_frameworks]
    for fw in detected_frameworks:
        results["frameworks"]["details"][fw["name"]] = {
            "confidence": fw["confidence"],
            "version": detect_framework_version(temp_dir, file_list, fw["name"])
        }

    # If no framework is detected with high confidence, assume native Android
    if not detected_frameworks or (len(detected_frameworks) == 1 and
                                   detected_frameworks[0]["name"] == "Native Android" and
                                   detected_frameworks[0]["confidence"] < 50):
        if "Native Android" not in results["frameworks"]["detected"]:
            results["frameworks"]["detected"].append("Native Android")
            results["frameworks"]["details"]["Native Android"] = {
                "confidence": 60,  # Default confidence for native Android
                "version": "Unknown"
            }

def detect_framework_version(temp_dir: str, file_list: List[str], framework_name: str) -> str:
    """Try to detect the version of the identified framework."""
    version = "Unknown"

    if framework_name == "Flutter":
        # Look for Flutter version in files
        for file_path in file_list:
            if "flutter_embedding" in file_path:
                try:
                    # This is a simplified approach - a real implementation would
                    # need more sophisticated parsing of binary files
                    full_path = os.path.join(temp_dir, file_path)
                    if os.path.isfile(full_path):
                        with open(full_path, 'rb') as f:
                            content = f.read().decode('utf-8', errors='ignore')
                            version_match = re.search(r'Flutter\s+Engine\s+Version:\s+([0-9\.]+)', content)
                            if version_match:
                                version = version_match.group(1)
                                break
                except Exception:
                    pass

    elif framework_name == "React Native":
        # Try to detect React Native version
        for file_path in file_list:
            if "react-native" in file_path.lower() and file_path.endswith(".json"):
                try:
                    full_path = os.path.join(temp_dir, file_path)
                    if os.path.isfile(full_path):
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            import json
                            content = json.load(f)
                            if "version" in content:
                                version = content["version"]
                                break
                except Exception:
                    pass

    elif framework_name == "Xamarin":
        # Look for Xamarin version info
        for file_path in file_list:
            if "Xamarin" in file_path and file_path.endswith(".dll"):
                # Getting version from DLL would require more specialized tools
                version = "Detected (version extraction requires additional tools)"
                break

    elif framework_name == "Cordova/PhoneGap":
        # Look for Cordova version in cordova.js
        cordova_js_file = next((f for f in file_list if f.endswith("cordova.js")), None)
        if cordova_js_file:
            try:
                full_path = os.path.join(temp_dir, cordova_js_file)
                if os.path.isfile(full_path):
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        version_match = re.search(r'CORDOVA_JS_BUILD_LABEL\s*=\s*[\'"](\d+\.\d+\.\d+)[\'"]', content)
                        if version_match:
                            version = version_match.group(1)
            except Exception:
                pass

    elif framework_name == "Unity":
        # Unity version is hard to extract from APK without specialized tools
        version = "Detected (version extraction requires additional tools)"

    elif framework_name == "Native Android":
        # Look for compileSdkVersion in AndroidManifest.xml or build config
        manifest_path = os.path.join(temp_dir, "AndroidManifest.xml")
        if os.path.exists(manifest_path):
            try:
                # Use aapt to dump the manifest
                aapt_process = subprocess.run(
                    ['aapt', 'dump', 'badging', os.path.join(temp_dir, "AndroidManifest.xml")],
                    capture_output=True,
                    text=True
                )
                manifest_content = aapt_process.stdout
                sdk_match = re.search(r'targetSdkVersion:\'(\d+)\'', manifest_content)
                if sdk_match:
                    android_version = map_android_sdk_to_version(sdk_match.group(1))
                    version = f"Target SDK {sdk_match.group(1)} (Android {android_version})"
            except Exception:
                pass

    return version

def map_android_sdk_to_version(sdk_level: str) -> str:
    """Map Android SDK level to version name."""
    sdk_map = {
        "33": "13.0",
        "32": "12.1",
        "31": "12.0",
        "30": "11.0",
        "29": "10.0",
        "28": "9.0",
        "27": "8.1",
        "26": "8.0",
        "25": "7.1",
        "24": "7.0",
        "23": "6.0",
        "22": "5.1",
        "21": "5.0",
        "19": "4.4",
        "18": "4.3",
        "17": "4.2",
        "16": "4.1",
        "15": "4.0.3",
        "14": "4.0",
        "13": "3.2",
        "12": "3.1",
        "11": "3.0",
        "10": "2.3.3",
        "9": "2.3",
        "8": "2.2",
    }
    return sdk_map.get(sdk_level, "Unknown")

def detect_libraries(temp_dir: str, file_list: List[str], results: Dict[str, Any]):
    """Detect libraries used in the application."""
    library_indicators = {
        "OkHttp": {
            "patterns": ["okhttp", "com/squareup/okhttp"],
            "confidence": 0,
            "category": "Networking"
        },
        "Retrofit": {
            "patterns": ["retrofit", "com/squareup/retrofit"],
            "confidence": 0,
            "category": "Networking"
        },
        "Glide": {
            "patterns": ["glide", "com/bumptech/glide"],
            "confidence": 0,
            "category": "Image Loading"
        },
        "Picasso": {
            "patterns": ["picasso", "com/squareup/picasso"],
            "confidence": 0,
            "category": "Image Loading"
        },
        "Fresco": {
            "patterns": ["fresco", "com/facebook/fresco"],
            "confidence": 0,
            "category": "Image Loading"
        },
        "Gson": {
            "patterns": ["gson", "com/google/gson"],
            "confidence": 0,
            "category": "JSON Parsing"
        },
        "Jackson": {
            "patterns": ["jackson", "com/fasterxml/jackson"],
            "confidence": 0,
            "category": "JSON Parsing"
        },
        "Moshi": {
            "patterns": ["moshi", "com/squareup/moshi"],
            "confidence": 0,
            "category": "JSON Parsing"
        },
        "RxJava": {
            "patterns": ["rxjava", "io/reactivex"],
            "confidence": 0,
            "category": "Asynchronous Programming"
        },
        "Dagger": {
            "patterns": ["dagger", "com/google/dagger"],
            "confidence": 0,
            "category": "Dependency Injection"
        },
        "Koin": {
            "patterns": ["koin", "org/koin"],
            "confidence": 0,
            "category": "Dependency Injection"
        },
        "Room": {
            "patterns": ["room", "androidx/room"],
            "confidence": 0,
            "category": "Database"
        },
        "Realm": {
            "patterns": ["realm", "io/realm"],
            "confidence": 0,
            "category": "Database"
        },
        "SQLite": {
            "patterns": ["sqlite", "android/database/sqlite"],
            "confidence": 0,
            "category": "Database"
        },
        "Jetpack Compose": {
            "patterns": ["compose", "androidx/compose"],
            "confidence": 0,
            "category": "UI Framework"
        },
        "Lottie": {
            "patterns": ["lottie", "com/airbnb/lottie"],
            "confidence": 0,
            "category": "Animation"
        },
        "Exoplayer": {
            "patterns": ["exoplayer", "com/google/android/exoplayer"],
            "confidence": 0,
            "category": "Media"
        },
        "ZXing": {
            "patterns": ["zxing", "com/google/zxing"],
            "confidence": 0,
            "category": "Barcode Scanning"
        },
        "Timber": {
            "patterns": ["timber", "timber/log"],
            "confidence": 0,
            "category": "Logging"
        },
        "LeakCanary": {
            "patterns": ["leakcanary", "com/squareup/leakcanary"],
            "confidence": 0,
            "category": "Debug Tools"
        }
    }

    # Check DEX files for library signatures
    dex_files = [f for f in file_list if f.endswith(".dex")]
    for dex_file in dex_files:
        dex_path = os.path.join(temp_dir, dex_file)
        try:
            # Use strings to extract text from DEX file
            strings_process = subprocess.run(
                ['strings', dex_path],
                capture_output=True,
                text=True
            )
            dex_strings = strings_process.stdout.lower()

            # Check for each library pattern
            for library, data in library_indicators.items():
                for pattern in data["patterns"]:
                    if pattern.lower() in dex_strings:
                        data["confidence"] += 1
        except Exception as e:
            logger.warning(f"Error analyzing DEX file for libraries: {e}")

    # Check for library folders/files in the file list
    for file_path in file_list:
        for library, data in library_indicators.items():
            for pattern in data["patterns"]:
                if pattern.lower() in file_path.lower():
                    data["confidence"] += 1

    # Collect detected libraries
    detected_libraries = []
    for library, data in library_indicators.items():
        if data["confidence"] > 0:
            detected_libraries.append({
                "name": library,
                "category": data["category"],
                "confidence": min(100, data["confidence"] * 25)  # Scale confidence to 0-100
            })

    # Sort by confidence and then by name
    detected_libraries.sort(key=lambda x: (-x["confidence"], x["name"]))

    # Group libraries by category
    library_categories = {}
    for lib in detected_libraries:
        if lib["category"] not in library_categories:
            library_categories[lib["category"]] = []
        library_categories[lib["category"]].append(lib["name"])

    results["libraries"]["detected"] = [lib["name"] for lib in detected_libraries]
    for lib in detected_libraries:
        results["libraries"]["details"][lib["name"]] = {
            "confidence": lib["confidence"],
            "category": lib["category"]
        }

    # Add categorized overview
    results["libraries"]["categories"] = library_categories

def detect_ui_toolkit(temp_dir: str, file_list: List[str], results: Dict[str, Any]):
    """Detect UI toolkit used in the application."""
    ui_toolkits = {
        "Material Design": {
            "patterns": [
                "com/google/android/material",
                "material_",
                "MaterialComponents",
                "@style/Theme.MaterialComponents"
            ],
            "confidence": 0
        },
        "AndroidX": {
            "patterns": [
                "androidx/appcompat",
                "androidx/recyclerview",
                "androidx/constraintlayout",
                "@style/Theme.AppCompat"
            ],
            "confidence": 0
        },
        "Jetpack Compose": {
            "patterns": [
                "androidx/compose",
                "Composable",
                "ComposeView"
            ],
            "confidence": 0
        },
        "Custom UI": {
            "patterns": [
                "custom_view",
                "CustomView",
                "extends View"
            ],
            "confidence": 0
        }
    }

    # Check resources and code for UI toolkit indicators
    for file_path in file_list:
        full_path = os.path.join(temp_dir, file_path)

        # Skip large binary files
        if os.path.isfile(full_path) and file_path.endswith(('.xml', '.dex', '.class', '.kt', '.java')):
            try:
                # For binary files, use strings
                if file_path.endswith(('.dex', '.class')):
                    strings_process = subprocess.run(
                        ['strings', full_path],
                        capture_output=True,
                        text=True
                    )
                    content = strings_process.stdout.lower()
                else:
                    # For text files, read directly
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read().lower()

                # Check for UI toolkit patterns
                for toolkit, data in ui_toolkits.items():
                    for pattern in data["patterns"]:
                        if pattern.lower() in content:
                            data["confidence"] += 1
            except Exception as e:
                pass

    # Determine the primary UI toolkit
    primary_toolkit = None
    max_confidence = 0

    for toolkit, data in ui_toolkits.items():
        if data["confidence"] > max_confidence:
            max_confidence = data["confidence"]
            primary_toolkit = toolkit

    # Set results
    if primary_toolkit:
        results["ui_toolkit"]["detected"] = primary_toolkit
        results["ui_toolkit"]["details"] = {
            "confidence": min(100, max_confidence * 10),  # Scale confidence to 0-100
            "alternative_toolkits": [
                toolkit for toolkit, data in ui_toolkits.items()
                if toolkit != primary_toolkit and data["confidence"] > 0
            ]
        }
    else:
        results["ui_toolkit"]["detected"] = "Unknown/Native Android UI"
        results["ui_toolkit"]["details"] = {
            "confidence": 50,
            "alternative_toolkits": []
        }

def detect_programming_languages(temp_dir: str, file_list: List[str], results: Dict[str, Any]):
    """Detect programming languages used in the application."""
    languages = {
        "Kotlin": {
            "patterns": [
                "kotlin/",
                "KotlinCompanionObject",
                ".kt"
            ],
            "confidence": 0
        },
        "Java": {
            "patterns": [
                "java/lang/Object",
                "java.lang.Object",
                ".java"
            ],
            "confidence": 0
        },
        "C++": {
            "patterns": [
                ".cpp",
                ".hpp",
                "libc++",
                "std::"
            ],
            "confidence": 0
        },
        "JavaScript": {
            "patterns": [
                ".js",
                "javascript",
                "function()",
                "var "
            ],
            "confidence": 0
        },
        "TypeScript": {
            "patterns": [
                ".ts",
                "typescript",
                "interface ",
                ": string"
            ],
            "confidence": 0
        },
        "C#": {
            "patterns": [
                "Microsoft.NET",
                "mscorlib",
                "System.Object"
            ],
            "confidence": 0
        },
        "Dart": {
            "patterns": [
                "dart-sdk",
                "_flutter.so",
                "dart:"
            ],
            "confidence": 0
        }
    }

    # Check for language indicators in files
    for file_path in file_list:
        for language, data in languages.items():
            for pattern in data["patterns"]:
                if pattern in file_path:
                    data["confidence"] += 1

    # Check DEX files for language-specific signatures
    dex_files = [f for f in file_list if f.endswith(".dex")]
    for dex_file in dex_files:
        dex_path = os.path.join(temp_dir, dex_file)
        try:
            # Use strings to extract text from DEX file
            strings_process = subprocess.run(
                ['strings', dex_path],
                capture_output=True,
                text=True
            )
            dex_strings = strings_process.stdout

            # Check for language signatures
            if "kotlin" in dex_strings.lower():
                languages["Kotlin"]["confidence"] += 5

            if "java.lang.Object" in dex_strings:
                languages["Java"]["confidence"] += 3

            # C++ signatures in native libraries
            if "std::" in dex_strings or "c++" in dex_strings.lower():
                languages["C++"]["confidence"] += 2

            # JavaScript signatures
            if "javascript" in dex_strings.lower() or "function(" in dex_strings:
                languages["JavaScript"]["confidence"] += 2

            # TypeScript gets converted to JavaScript, so hard to detect
            if "typescript" in dex_strings.lower():
                languages["TypeScript"]["confidence"] += 3

            # C# signatures
            if "mscorlib" in dex_strings or "System.Object" in dex_strings:
                languages["C#"]["confidence"] += 3

            # Dart signatures
            if "dart:" in dex_strings or "_flutter.so" in dex_strings:
                languages["Dart"]["confidence"] += 3

        except Exception as e:
            logger.warning(f"Error analyzing DEX file for languages: {e}")

    # Get detected languages sorted by confidence
    detected_languages = []
    for language, data in languages.items():
        if data["confidence"] > 0:
            detected_languages.append({
                "name": language,
                "confidence": min(100, data["confidence"] * 10)  # Scale confidence to 0-100
            })

    # Sort by confidence
    detected_languages.sort(key=lambda x: x["confidence"], reverse=True)

    # Set results
    results["programming_languages"]["detected"] = [lang["name"] for lang in detected_languages]
    for lang in detected_languages:
        results["programming_languages"]["details"][lang["name"]] = {
            "confidence": lang["confidence"],
            "primary": lang == detected_languages[0] if detected_languages else False
        }

    # If no languages detected, assume Java (most common for Android)
    if not detected_languages:
        results["programming_languages"]["detected"] = ["Java"]
        results["programming_languages"]["details"]["Java"] = {
            "confidence": 60,
            "primary": True
        }

def detect_backend_technologies(temp_dir: str, file_list: List[str], results: Dict[str, Any]):
    """Detect backend technologies and APIs used."""
    backend_indicators = {
        "Firebase": {
            "patterns": [
                "com/google/firebase",
                "FirebaseApp",
                "firebase",
                "google-services.json"
            ],
            "confidence": 0
        },
        "AWS": {
            "patterns": [
                "com/amazonaws",
                "AmazonWebServiceClient",
                "aws-android-sdk"
            ],
            "confidence": 0
        },
        "Google Cloud": {
            "patterns": [
                "com/google/cloud",
                "GoogleCloudClient",
                "gcloud-"
            ],
            "confidence": 0
        },
        "Azure": {
            "patterns": [
                "com/microsoft/azure",
                "AzureClient",
                "azure-"
            ],
            "confidence": 0
        },
        "MongoDB": {
            "patterns": [
                "com/mongodb",
                "MongoClient",
                "mongodb"
            ],
            "confidence": 0
        },
        "GraphQL": {
            "patterns": [
                "graphql",
                "com/apollographql",
                "GraphQLQuery"
            ],
            "confidence": 0
        },
        "REST API": {
            "patterns": [
                "retrofit",
                "okhttp",
                "HttpClient",
                "RestApi"
            ],
            "confidence": 0
        },
        "WebSockets": {
            "patterns": [
                "websocket",
                "WebSocketClient",
                "Socket.IO"
            ],
            "confidence": 0
        }
    }

    # Check for backend indicators in DEX files
    dex_files = [f for f in file_list if f.endswith(".dex")]
    for dex_file in dex_files:
        dex_path = os.path.join(temp_dir, dex_file)
        try:
            # Use strings to extract text from DEX file
            strings_process = subprocess.run(
                ['strings', dex_path],
                capture_output=True,
                text=True
            )
            dex_strings = strings_process.stdout.lower()

            # Check for backend technology patterns
            for backend, data in backend_indicators.items():
                for pattern in data["patterns"]:
                    if pattern.lower() in dex_strings:
                        data["confidence"] += 1

        except Exception as e:
            logger.warning(f"Error analyzing DEX file for backend technologies: {e}")

    # Check for backend config files
    for file_path in file_list:
        for backend, data in backend_indicators.items():
            for pattern in data["patterns"]:
                if pattern.lower() in file_path.lower():
                    data["confidence"] += 1

    # Get detected backend technologies
    detected_backends = []
    for backend, data in backend_indicators.items():
        if data["confidence"] > 0:
            detected_backends.append({
                "name": backend,
                "confidence": min(100, data["confidence"] * 15)  # Scale confidence to 0-100
            })

    # Sort by confidence
    detected_backends.sort(key=lambda x: x["confidence"], reverse=True)

    # Set results
    results["backend_technologies"]["detected"] = [be["name"] for be in detected_backends]
    for be in detected_backends:
        results["backend_technologies"]["details"][be["name"]] = {
            "confidence": be["confidence"]
        }

    # Special case: If we found REST API patterns but no specific backend
    if "REST API" in results["backend_technologies"]["detected"] and len(detected_backends) == 1:
        results["backend_technologies"]["details"]["REST API"]["note"] = "Generic REST API usage detected, but no specific backend service identified."

def detect_analytics_services(temp_dir: str, file_list: List[str], results: Dict[str, Any]):
    """Detect analytics services used in the application."""
    analytics_indicators = {
        "Google Analytics": {
            "patterns": [
                "com/google/android/gms/analytics",
                "GoogleAnalytics",
                "analytics",
                "firebase/analytics"
            ],
            "confidence": 0
        },
        "Firebase Analytics": {
            "patterns": [
                "com/google/firebase/analytics",
                "FirebaseAnalytics",
                "google-services.json"
            ],
            "confidence": 0
        },
        "Flurry": {
            "patterns": [
                "com/flurry/android",
                "FlurryAgent",
                "flurry_"
            ],
            "confidence": 0
        },
        "Mixpanel": {
            "patterns": [
                "com/mixpanel",
                "MixpanelAPI",
                "mixpanel"
            ],
            "confidence": 0
        },
        "Amplitude": {
            "patterns": [
                "com/amplitude",
                "AmplitudeClient",
                "amplitude"
            ],
            "confidence": 0
        },
        "AppMetrica": {
            "patterns": [
                "com/yandex/metrica",
                "AppMetricaConfig",
                "appmetrica"
            ],
            "confidence": 0
        },
        "Crashlytics": {
            "patterns": [
                "com/crashlytics",
                "com/google/firebase/crashlytics",
                "Crashlytics",
                "fabric"
            ],
            "confidence": 0
        },
        "Segment": {
            "patterns": [
                "com/segment/analytics",
                "Analytics.with",
                "segment-analytics"
            ],
            "confidence": 0
        }
    }

    # Check files for analytics service indicators
    for file_path in file_list:
        full_path = os.path.join(temp_dir, file_path)

        if os.path.isfile(full_path) and (file_path.endswith('.dex') or file_path.endswith('.json')):
            try:
                # For binary files, use strings
                if file_path.endswith('.dex'):
                    strings_process = subprocess.run(
                        ['strings', full_path],
                        capture_output=True,
                        text=True
                    )
                    content = strings_process.stdout.lower()
                else:
                    # For JSON files, read directly
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read().lower()

                # Check for analytics service patterns
                for service, data in analytics_indicators.items():
                    for pattern in data["patterns"]:
                        if pattern.lower() in content:
                            data["confidence"] += 1
            except Exception as e:
                pass

    # Get detected analytics services
    detected_services = []
    for service, data in analytics_indicators.items():
        if data["confidence"] > 0:
            detected_services.append({
                "name": service,
                "confidence": min(100, data["confidence"] * 25)  # Scale confidence to 0-100
            })

    # Sort by confidence
    detected_services.sort(key=lambda x: x["confidence"], reverse=True)

    # Set results
    results["analytics_services"]["detected"] = [service["name"] for service in detected_services]
    for service in detected_services:
        results["analytics_services"]["details"][service["name"]] = {
            "confidence": service["confidence"]
        }

def detect_ad_networks(temp_dir: str, file_list: List[str], results: Dict[str, Any]):
    """Detect ad networks used in the application."""
    ad_network_indicators = {
        "AdMob": {
            "patterns": [
                "com/google/android/gms/ads",
                "AdMob",
                "admob",
                "com.google.ads"
            ],
            "confidence": 0
        },
        "Facebook Audience Network": {
            "patterns": [
                "com/facebook/ads",
                "AudienceNetwork",
                "facebook_ads"
            ],
            "confidence": 0
        },
        "Unity Ads": {
            "patterns": [
                "com/unity3d/ads",
                "UnityAds",
                "unity_ads"
            ],
            "confidence": 0
        },
        "AppLovin": {
            "patterns": [
                "com/applovin",
                "AppLovin",
                "applovin"
            ],
            "confidence": 0
        },
        "MoPub": {
            "patterns": [
                "com/mopub",
                "MoPub",
                "mopub"
            ],
            "confidence": 0
        },
        "IronSource": {
            "patterns": [
                "com/ironsource",
                "IronSource",
                "ironsource"
            ],
            "confidence": 0
        },
        "InMobi": {
            "patterns": [
                "com/inmobi",
                "InMobi",
                "inmobi"
            ],
            "confidence": 0
        },
        "Tapjoy": {
            "patterns": [
                "com/tapjoy",
                "Tapjoy",
                "tapjoy"
            ],
            "confidence": 0
        }
    }

    # Check for ad network indicators in files
    for file_path in file_list:
        full_path = os.path.join(temp_dir, file_path)

        if os.path.isfile(full_path) and file_path.endswith('.dex'):
            try:
                # Use strings to extract text from DEX file
                strings_process = subprocess.run(
                    ['strings', full_path],
                    capture_output=True,
                    text=True
                )
                content = strings_process.stdout.lower()

                # Check for ad network patterns
                for network, data in ad_network_indicators.items():
                    for pattern in data["patterns"]:
                        if pattern.lower() in content:
                            data["confidence"] += 1
            except Exception as e:
                pass

    # Additional check in AndroidManifest.xml
    manifest_path = os.path.join(temp_dir, "AndroidManifest.xml")
    if os.path.exists(manifest_path):
        try:
            # Use aapt to dump the manifest
            aapt_process = subprocess.run(
                ['aapt', 'dump', 'xmltree', manifest_path],
                capture_output=True,
                text=True
            )
            manifest_content = aapt_process.stdout.lower()

            # Check for ad network patterns in manifest
            for network, data in ad_network_indicators.items():
                for pattern in data["patterns"]:
                    if pattern.lower() in manifest_content:
                        data["confidence"] += 2  # Higher confidence for manifest entries
        except Exception as e:
            pass

    # Get detected ad networks
    detected_networks = []
    for network, data in ad_network_indicators.items():
        if data["confidence"] > 0:
            detected_networks.append({
                "name": network,
                "confidence": min(100, data["confidence"] * 20)  # Scale confidence to 0-100
            })

    # Sort by confidence
    detected_networks.sort(key=lambda x: x["confidence"], reverse=True)

    # Set results
    results["ad_networks"]["detected"] = [network["name"] for network in detected_networks]
    for network in detected_networks:
        results["ad_networks"]["details"][network["name"]] = {
            "confidence": network["confidence"]
        }
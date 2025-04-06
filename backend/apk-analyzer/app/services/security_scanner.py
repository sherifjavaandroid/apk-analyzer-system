# backend/apk-analyzer/app/services/security_scanner.py
import os
import re
import zipfile
import tempfile
import subprocess
import logging
from typing import Dict, List, Any, Optional, Tuple
import shutil

logger = logging.getLogger(__name__)

class SecurityIssue:
    def __init__(self, issue_id: str, severity: str, title: str, description: str,
                 location: Optional[str] = None, line_number: Optional[int] = None):
        self.issue_id = issue_id
        self.severity = severity  # "critical", "high", "medium", "low", "info"
        self.title = title
        self.description = description
        self.location = location
        self.line_number = line_number
        self.recommendation = None
        self.cvss_score = None
        self.references = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "issue_id": self.issue_id,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "line_number": self.line_number,
            "recommendation": self.recommendation,
            "cvss_score": self.cvss_score,
            "references": self.references
        }

def scan_apk_security(apk_path: str) -> Dict[str, Any]:
    """
    Scan an APK file for security vulnerabilities.

    Args:
        apk_path: Path to the APK file

    Returns:
        Dictionary containing security scan results
    """
    security_issues = []
    risk_score = 0

    # Create a temporary directory for extraction
    temp_dir = tempfile.mkdtemp()

    try:
        # Extract the APK
        with zipfile.ZipFile(apk_path, 'r') as apk_zip:
            apk_zip.extractall(temp_dir)

        # Run security checks
        manifest_issues = check_manifest_security(temp_dir)
        security_issues.extend(manifest_issues)

        code_issues = check_code_security(temp_dir)
        security_issues.extend(code_issues)

        network_issues = check_network_security(temp_dir)
        security_issues.extend(network_issues)

        encryption_issues = check_encryption(temp_dir)
        security_issues.extend(encryption_issues)

        permission_issues = check_permissions(temp_dir)
        security_issues.extend(permission_issues)

        # Calculate risk score (0-100)
        risk_score = calculate_risk_score(security_issues)

    except Exception as e:
        logger.error(f"Error in security scanning: {e}")
        # Add an error issue
        error_issue = SecurityIssue(
            "SCAN_ERROR",
            "info",
            "Scan Error",
            f"An error occurred during security scanning: {str(e)}"
        )
        security_issues.append(error_issue)
    finally:
        # Clean up
        try:
            shutil.rmtree(temp_dir)
        except Exception as e:
            logger.warning(f"Failed to clean up temporary directory: {e}")

    # Convert to dictionary
    issues_dict = [issue.to_dict() for issue in security_issues]

    # Group issues by severity for easier reporting
    severity_counts = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "info": 0
    }

    for issue in security_issues:
        if issue.severity in severity_counts:
            severity_counts[issue.severity] += 1

    return {
        "risk_score": risk_score,
        "issues_count": len(security_issues),
        "severity_counts": severity_counts,
        "issues": issues_dict,
    }

def check_manifest_security(extracted_path: str) -> List[SecurityIssue]:
    """Check for security issues in the AndroidManifest.xml file."""
    issues = []

    manifest_path = os.path.join(extracted_path, "AndroidManifest.xml")
    if not os.path.exists(manifest_path):
        return issues

    # Try to use aapt to dump the manifest
    try:
        manifest_content = ""
        aapt_process = subprocess.run(
            ['aapt', 'dump', 'xmltree', manifest_path],
            capture_output=True,
            text=True
        )
        manifest_content = aapt_process.stdout

        # Debug backup disabled check
        if "android:allowBackup=\"true\"" in manifest_content or "allowBackup: true" in manifest_content:
            issue = SecurityIssue(
                "ALLOW_BACKUP_ENABLED",
                "medium",
                "Backup Not Disabled",
                "The application allows backups, which may expose sensitive application data."
            )
            issue.recommendation = "Add 'android:allowBackup=\"false\"' to the application tag in AndroidManifest.xml"
            issue.references = [
                "https://developer.android.com/guide/topics/data/autobackup",
                "https://owasp.org/www-project-mobile-top-10/2016-risks/m2-insecure-data-storage"
            ]
            issues.append(issue)

        # Debug mode check
        if "android:debuggable=\"true\"" in manifest_content or "debuggable: true" in manifest_content:
            issue = SecurityIssue(
                "DEBUGGABLE_APP",
                "high",
                "Application is Debuggable",
                "The application is debuggable in release mode, which may allow attackers to access sensitive information."
            )
            issue.recommendation = "Remove 'android:debuggable=\"true\"' from the application tag in AndroidManifest.xml"
            issue.references = [
                "https://developer.android.com/guide/topics/manifest/application-element#debug",
                "https://owasp.org/www-project-mobile-top-10/2016-risks/m10-extraneous-functionality"
            ]
            issues.append(issue)

        # Exported components check
        if re.search(r"exported(?:=|\s*[:=]\s*)\"true\"", manifest_content):
            exported_activities = re.findall(r"activity\s+.*exported(?:=|\s*[:=]\s*)\"true\".*?name(?:=|\s*[:=]\s*)\"([^\"]+)\"", manifest_content)
            exported_services = re.findall(r"service\s+.*exported(?:=|\s*[:=]\s*)\"true\".*?name(?:=|\s*[:=]\s*)\"([^\"]+)\"", manifest_content)
            exported_receivers = re.findall(r"receiver\s+.*exported(?:=|\s*[:=]\s*)\"true\".*?name(?:=|\s*[:=]\s*)\"([^\"]+)\"", manifest_content)
            exported_providers = re.findall(r"provider\s+.*exported(?:=|\s*[:=]\s*)\"true\".*?name(?:=|\s*[:=]\s*)\"([^\"]+)\"", manifest_content)

            all_exported = exported_activities + exported_services + exported_receivers + exported_providers
            if all_exported:
                description = f"The application has {len(all_exported)} exported components that may be accessible by other applications:"
                for component in all_exported[:5]:  # Show first 5
                    description += f"\n- {component}"
                if len(all_exported) > 5:
                    description += f"\n- ... and {len(all_exported) - 5} more"

                issue = SecurityIssue(
                    "EXPORTED_COMPONENTS",
                    "medium",
                    "Exported Components",
                    description
                )
                issue.recommendation = "Ensure all exported components are properly protected with permissions or intent filters."
                issue.references = [
                    "https://developer.android.com/guide/topics/manifest/activity-element#exported",
                    "https://owasp.org/www-project-mobile-top-10/2016-risks/m1-improper-platform-usage"
                ]
                issues.append(issue)

        # Check for missing network security config
        if "android:networkSecurityConfig" not in manifest_content:
            issue = SecurityIssue(
                "MISSING_NETWORK_SECURITY_CONFIG",
                "medium",
                "Missing Network Security Configuration",
                "The application does not define a Network Security Configuration, which can help protect network communications."
            )
            issue.recommendation = "Add a Network Security Configuration to enforce secure connections."
            issue.references = [
                "https://developer.android.com/training/articles/security-config",
                "https://owasp.org/www-project-mobile-top-10/2016-risks/m3-insecure-communication"
            ]
            issues.append(issue)

    except Exception as e:
        logger.warning(f"Error checking manifest: {e}")

    return issues

def check_code_security(extracted_path: str) -> List[SecurityIssue]:
    """Check for security issues in the app code."""
    issues = []

    # Check for DEX files
    dex_files = []
    for root, _, files in os.walk(extracted_path):
        dex_files.extend([os.path.join(root, f) for f in files if f.endswith('.dex')])

    if not dex_files:
        return issues

    # Look for hardcoded secrets and sensitive functions in dex files
    sensitive_patterns = [
        (r"https?://[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+/[a-zA-Z0-9_.~!*''();:@&=+$,/?%#[-]*",
         "HARDCODED_URL", "medium", "Hardcoded URL",
         "The application contains hardcoded URLs which may expose sensitive information or backend services."),

        (r"(?<![a-zA-Z0-9_])(?:password|passwd|pwd|secret|key|token|auth|credentials)[\s]*[=:].{0,30}['\"][^\s]{8,}['\"]",
         "HARDCODED_SECRET", "high", "Hardcoded Secret",
         "The application contains what appears to be a hardcoded secret, password, or key."),

        (r"(?:firebase|aws|azure|api)[_.-]?key['\"]?\s*[=:]\s*['\"][a-zA-Z0-9_-]{20,}['\"]",
         "HARDCODED_API_KEY", "high", "Hardcoded API Key",
         "The application contains what appears to be a hardcoded API key."),

        (r"Log\s*\.\s*(v|d|i|w|e|wtf)\s*\(\s*(?:TAG)?\s*,\s*[\"']",
         "SENSITIVE_LOGGING", "low", "Logging of Potentially Sensitive Information",
         "The application may log sensitive information which could be accessible to other apps."),
    ]

    # We can't directly search dex files as they're binary, but we can use strings or dexdump
    # This is a simplified approach - in a real system you'd use proper dex parsing
    for dex_file in dex_files:
        try:
            # Use 'strings' command to extract strings from the DEX file
            strings_process = subprocess.run(
                ['strings', dex_file],
                capture_output=True,
                text=True
            )
            dex_strings = strings_process.stdout

            for pattern, issue_id, severity, title, description in sensitive_patterns:
                matches = re.findall(pattern, dex_strings)
                if matches:
                    # Create an issue for each unique match, but limit to prevent overwhelming reports
                    unique_matches = set(matches[:5])
                    for match in unique_matches:
                        # Redact potential secrets in the reported issue
                        if issue_id in ["HARDCODED_SECRET", "HARDCODED_API_KEY"]:
                            # Show only first few characters
                            displayed_match = match[:15] + "..." if len(match) > 15 else match
                        else:
                            displayed_match = match

                        issue = SecurityIssue(
                            issue_id,
                            severity,
                            title,
                            f"{description}\nExample found: {displayed_match}",
                            os.path.basename(dex_file)
                        )

                        if issue_id == "HARDCODED_SECRET":
                            issue.recommendation = "Store sensitive information in secure storage and not in the code."
                            issue.references = [
                                "https://developer.android.com/training/articles/keystore",
                                "https://owasp.org/www-project-mobile-top-10/2016-risks/m2-insecure-data-storage"
                            ]
                        elif issue_id == "HARDCODED_API_KEY":
                            issue.recommendation = "Use Android's secure storage options for API keys or implement API key request systems."
                            issue.references = [
                                "https://developer.android.com/training/articles/keystore",
                                "https://owasp.org/www-project-mobile-top-10/2016-risks/m2-insecure-data-storage"
                            ]
                        elif issue_id == "SENSITIVE_LOGGING":
                            issue.recommendation = "Ensure sensitive information is not logged, especially in production builds."
                            issue.references = [
                                "https://developer.android.com/reference/android/util/Log",
                                "https://owasp.org/www-project-mobile-top-10/2016-risks/m2-insecure-data-storage"
                            ]

                        issues.append(issue)

                        # Limit to prevent overwhelming reports
                        if len(issues) >= 20:
                            return issues

        except Exception as e:
            logger.warning(f"Error analyzing DEX file {dex_file}: {e}")

    return issues

def check_network_security(extracted_path: str) -> List[SecurityIssue]:
    """Check for network security configuration and issues."""
    issues = []

    # Check network security config file existence
    network_config_path = os.path.join(extracted_path, "res", "xml", "network_security_config.xml")
    if os.path.exists(network_config_path):
        # Check content of network security config
        try:
            with open(network_config_path, 'r', encoding='utf-8', errors='ignore') as f:
                config_content = f.read()

                # Check if cleartext traffic is allowed
                if "cleartextTrafficPermitted=\"true\"" in config_content:
                    issue = SecurityIssue(
                        "CLEARTEXT_TRAFFIC",
                        "high",
                        "Cleartext Traffic Allowed",
                        "The application allows cleartext (unencrypted) network traffic, which can be intercepted."
                    )
                    issue.recommendation = "Use HTTPS for all network communications and set cleartextTrafficPermitted to false."
                    issue.references = [
                        "https://developer.android.com/training/articles/security-config#CleartextTrafficPermitted",
                        "https://owasp.org/www-project-mobile-top-10/2016-risks/m3-insecure-communication"
                    ]
                    issues.append(issue)

                # Check for certificate pinning
                if "pin-set" not in config_content:
                    issue = SecurityIssue(
                        "NO_CERT_PINNING",
                        "medium",
                        "Certificate Pinning Not Implemented",
                        "The application does not use certificate pinning, which could make it vulnerable to man-in-the-middle attacks."
                    )
                    issue.recommendation = "Implement certificate pinning for critical domains."
                    issue.references = [
                        "https://developer.android.com/training/articles/security-config#CertificatePinning",
                        "https://owasp.org/www-project-mobile-top-10/2016-risks/m3-insecure-communication"
                    ]
                    issues.append(issue)

                # Check for custom trust anchors
                if "trust-anchors" in config_content and "certificates src=\"user\"" in config_content:
                    issue = SecurityIssue(
                        "USER_CERTS_ALLOWED",
                        "medium",
                        "User-Added CA Certificates Trusted",
                        "The application trusts user-added CA certificates, which could enable network traffic interception."
                    )
                    issue.recommendation = "Avoid trusting user-added certificates for sensitive communications."
                    issue.references = [
                        "https://developer.android.com/training/articles/security-config#CustomTrustAnchors",
                        "https://owasp.org/www-project-mobile-top-10/2016-risks/m3-insecure-communication"
                    ]
                    issues.append(issue)

        except Exception as e:
            logger.warning(f"Error checking network security config: {e}")

    # Check manifest for cleartext permissions
    manifest_path = os.path.join(extracted_path, "AndroidManifest.xml")
    if os.path.exists(manifest_path):
        try:
            # Use aapt to dump the manifest
            aapt_process = subprocess.run(
                ['aapt', 'dump', 'xmltree', manifest_path],
                capture_output=True,
                text=True
            )
            manifest_content = aapt_process.stdout

            if "android:usesCleartextTraffic=\"true\"" in manifest_content:
                issue = SecurityIssue(
                    "USES_CLEARTEXT_TRAFFIC",
                    "high",
                    "Uses Cleartext Traffic",
                    "The application explicitly allows cleartext (unencrypted) network traffic in the manifest."
                )
                issue.recommendation = "Use HTTPS for all network communications and remove usesCleartextTraffic or set it to false."
                issue.references = [
                    "https://developer.android.com/guide/topics/manifest/application-element#usesCleartextTraffic",
                    "https://owasp.org/www-project-mobile-top-10/2016-risks/m3-insecure-communication"
                ]
                issues.append(issue)

        except Exception as e:
            logger.warning(f"Error checking manifest for cleartext traffic: {e}")

    return issues

def check_encryption(extracted_path: str) -> List[SecurityIssue]:
    """Check for proper encryption usage."""
    issues = []

    # Look for DEX files to analyze
    dex_files = []
    for root, _, files in os.walk(extracted_path):
        dex_files.extend([os.path.join(root, f) for f in files if f.endswith('.dex')])

    if not dex_files:
        return issues

    # Define insecure encryption patterns
    insecure_patterns = [
        (r"Cipher\.getInstance\([\"']DES[\"']",
         "WEAK_ENCRYPTION_DES", "high", "Weak Encryption Algorithm (DES)",
         "The application uses DES encryption, which is considered insecure."),

        (r"Cipher\.getInstance\([\"']RC4[\"']",
         "WEAK_ENCRYPTION_RC4", "high", "Weak Encryption Algorithm (RC4)",
         "The application uses RC4 encryption, which is considered insecure."),

        (r"Cipher\.getInstance\([\"']AES/ECB",
         "INSECURE_AES_MODE", "high", "Insecure AES Mode (ECB)",
         "The application uses AES in ECB mode, which is cryptographically weak."),

        (r"MessageDigest\.getInstance\([\"']MD5[\"']",
         "WEAK_HASH_MD5", "high", "Weak Hash Algorithm (MD5)",
         "The application uses MD5 hash algorithm, which is vulnerable to collisions."),

        (r"MessageDigest\.getInstance\([\"']SHA-1[\"']",
         "WEAK_HASH_SHA1", "medium", "Weak Hash Algorithm (SHA-1)",
         "The application uses SHA-1 hash algorithm, which is vulnerable to collisions."),

        (r"SecureRandom\.getInstance\([\"']SHA1PRNG[\"']",
         "INSECURE_RANDOM", "medium", "Potentially Insecure Random Number Generator",
         "The application uses SHA1PRNG, which may not provide sufficient entropy on all platforms."),

        (r"(?:SecretKeySpec|PBEKeySpec).{0,40}['\"][^\s]{8,}['\"]",
         "HARDCODED_ENCRYPTION_KEY", "critical", "Hardcoded Encryption Key",
         "The application contains what appears to be a hardcoded encryption key."),
    ]

    for dex_file in dex_files:
        try:
            # Use 'strings' command to extract strings from the DEX file
            strings_process = subprocess.run(
                ['strings', dex_file],
                capture_output=True,
                text=True
            )
            dex_strings = strings_process.stdout

            for pattern, issue_id, severity, title, description in insecure_patterns:
                if re.search(pattern, dex_strings):
                    issue = SecurityIssue(
                        issue_id,
                        severity,
                        title,
                        description,
                        os.path.basename(dex_file)
                    )

                    if "WEAK_ENCRYPTION" in issue_id:
                        issue.recommendation = "Use strong encryption algorithms like AES-256 with GCM mode."
                        issue.references = [
                            "https://developer.android.com/guide/topics/security/cryptography",
                            "https://owasp.org/www-project-mobile-top-10/2016-risks/m5-insufficient-cryptography"
                        ]
                    elif issue_id == "INSECURE_AES_MODE":
                        issue.recommendation = "Use AES with CBC or GCM mode instead of ECB."
                        issue.references = [
                            "https://developer.android.com/guide/topics/security/cryptography",
                            "https://owasp.org/www-project-mobile-top-10/2016-risks/m5-insufficient-cryptography"
                        ]
                    elif "WEAK_HASH" in issue_id:
                        issue.recommendation = "Use secure hash algorithms like SHA-256 or SHA-3."
                        issue.references = [
                            "https://developer.android.com/reference/java/security/MessageDigest",
                            "https://owasp.org/www-project-mobile-top-10/2016-risks/m5-insufficient-cryptography"
                        ]
                    elif issue_id == "INSECURE_RANDOM":
                        issue.recommendation = "Use SecureRandom without specifying the algorithm or use newer APIs like java.security.SecureRandom.getInstanceStrong()."
                        issue.references = [
                            "https://developer.android.com/reference/java/security/SecureRandom",
                            "https://owasp.org/www-project-mobile-top-10/2016-risks/m5-insufficient-cryptography"
                        ]
                    elif issue_id == "HARDCODED_ENCRYPTION_KEY":
                        issue.recommendation = "Store encryption keys securely using the Android Keystore system."
                        issue.references = [
                            "https://developer.android.com/training/articles/keystore",
                            "https://owasp.org/www-project-mobile-top-10/2016-risks/m5-insufficient-cryptography"
                        ]

                    issues.append(issue)

        except Exception as e:
            logger.warning(f"Error checking encryption in {dex_file}: {e}")

    return issues

def check_permissions(extracted_path: str) -> List[SecurityIssue]:
    """Check for excessive or dangerous permissions."""
    issues = []

    manifest_path = os.path.join(extracted_path, "AndroidManifest.xml")
    if not os.path.exists(manifest_path):
        return issues

    dangerous_permissions = {
        "android.permission.READ_PHONE_STATE": "Phone State",
        "android.permission.PROCESS_OUTGOING_CALLS": "Outgoing Calls",
        "android.permission.READ_SMS": "Read SMS",
        "android.permission.RECEIVE_SMS": "Receive SMS",
        "android.permission.RECEIVE_WAP_PUSH": "WAP Push",
        "android.permission.RECEIVE_MMS": "MMS",
        "android.permission.SEND_SMS": "Send SMS",
        "android.permission.READ_CONTACTS": "Contacts",
        "android.permission.WRITE_CONTACTS": "Modify Contacts",
        "android.permission.ACCESS_FINE_LOCATION": "Precise Location",
        "android.permission.ACCESS_COARSE_LOCATION": "Approximate Location",
        "android.permission.ACCESS_BACKGROUND_LOCATION": "Background Location",
        "android.permission.RECORD_AUDIO": "Microphone",
        "android.permission.CAMERA": "Camera",
        "android.permission.WRITE_EXTERNAL_STORAGE": "Storage",
        "android.permission.READ_CALENDAR": "Calendar",
        "android.permission.WRITE_CALENDAR": "Modify Calendar",
        "android.permission.GET_ACCOUNTS": "Accounts",
        "android.permission.READ_CALL_LOG": "Call Log",
        "android.permission.WRITE_CALL_LOG": "Modify Call Log",
        "android.permission.BODY_SENSORS": "Body Sensors",
        "android.permission.ACTIVITY_RECOGNITION": "Activity Recognition",
        "android.permission.SYSTEM_ALERT_WINDOW": "Draw Over Other Apps",
        "android.permission.READ_LOGS": "System Logs",
    }

    try:
        # Use aapt to dump the manifest
        aapt_process = subprocess.run(
            ['aapt', 'dump', 'xmltree', manifest_path],
            capture_output=True,
            text=True
        )
        manifest_content = aapt_process.stdout

        # Extract permissions
        permissions = []
        for line in manifest_content.splitlines():
            if "uses-permission:" in line or "uses-permission-sdk" in line:
                perm_line = line.strip()
                next_line_index = manifest_content.splitlines().index(line) + 1
                if next_line_index < len(manifest_content.splitlines()) and "A: android:name" in manifest_content.splitlines()[next_line_index]:
                    name_line = manifest_content.splitlines()[next_line_index]
                    if 'name="' in name_line:
                        perm_name = name_line.split('name="')[1].split('"')[0]
                        permissions.append(perm_name)

        # Check for dangerous permissions
        dangerous_found = []
        for perm in permissions:
            if perm in dangerous_permissions:
                dangerous_found.append((perm, dangerous_permissions[perm]))

        if dangerous_found:
            # Create issue for dangerous permissions
            description = "The application requests the following dangerous permissions:"
            for perm, desc in dangerous_found:
                description += f"\n- {desc} ({perm})"

            issue = SecurityIssue(
                "DANGEROUS_PERMISSIONS",
                "medium",
                "Dangerous Permissions Requested",
                description
            )
            issue.recommendation = "Request only permissions that are essential for app functionality."
            issue.references = [
                "https://developer.android.com/guide/topics/permissions/overview",
                "https://owasp.org/www-project-mobile-top-10/2016-risks/m1-improper-platform-usage"
            ]
            issues.append(issue)

        # Check for excessive permissions
        if len(permissions) > 15:
            issue = SecurityIssue(
                "EXCESSIVE_PERMISSIONS",
                "low",
                "Excessive Number of Permissions",
                f"The application requests {len(permissions)} permissions, which may indicate permission creep."
            )
            issue.recommendation = "Review all permissions and remove those not essential for app functionality."
            issue.references = [
                "https://developer.android.com/training/permissions/requesting",
                "https://owasp.org/www-project-mobile-top-10/2016-risks/m1-improper-platform-usage"
            ]
            issues.append(issue)

    except Exception as e:
        logger.warning(f"Error checking permissions: {e}")

    return issues

def calculate_risk_score(issues: List[SecurityIssue]) -> int:
    """
    Calculate a risk score from 0-100 based on the security issues found.
    Higher score means higher risk.
    """
    # Weights for different severity levels
    severity_weights = {
        "critical": 10,
        "high": 5,
        "medium": 3,
        "low": 1,
        "info": 0
    }

    # Calculate weighted sum of issues
    weighted_sum = sum(severity_weights.get(issue.severity, 0) for issue in issues)

    # A perfect score would be 0 (no issues)
    # Let's define some thresholds:
    # 0 issues = 0 score
    # 5 critical issues = 50 score
    # 10+ critical issues = 100 score
    max_reasonable_weight = 100  # 10 critical issues

    # Calculate score on a scale of 0-100
    risk_score = min(100, int((weighted_sum / max_reasonable_weight) * 100))

    return risk_score
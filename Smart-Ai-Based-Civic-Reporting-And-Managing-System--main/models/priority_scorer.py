"""
Phase 4: Priority Scoring Engine

This script calculates complaint priority from:
1. Severity level
2. Number of people affected
3. Whether it is near a sensitive location
"""


def calculate_priority(severity, people_affected, near_sensitive_location=False):
    """
    Calculate urgency label for a complaint.

    Parameters:
        severity (str): One of "low", "medium", "high", "critical"
        people_affected (int): Estimated number of people affected
        near_sensitive_location (bool): True if near hospital/school/etc.

    Returns:
        str: Priority label -> "Low", "Medium", "High", or "Critical"
    """

    # Map severity text to base score
    severity_scores = {
        "low": 1,
        "medium": 2,
        "high": 3,
        "critical": 4,
    }

    # Convert input to lowercase and fetch base score
    # If invalid severity is provided, default to low (1)
    score = severity_scores.get(str(severity).lower(), 1)

    # Add impact score based on number of affected people
    if people_affected >= 100:
        score += 2
    elif people_affected >= 20:
        score += 1

    # Add 1 point if location is sensitive
    if near_sensitive_location:
        score += 1

    # Convert final numeric score to priority label
    if score >= 6:
        return "Critical"
    if score >= 4:
        return "High"
    if score >= 2:
        return "Medium"
    return "Low"


if __name__ == "__main__":
    # Example 1
    result_1 = calculate_priority(
        severity="high",
        people_affected=150,
        near_sensitive_location=True,
    )

    # Example 2
    result_2 = calculate_priority(
        severity="low",
        people_affected=5,
        near_sensitive_location=False,
    )

    # Print readable output
    print("Phase 4: Priority Scoring Engine\n")

    print("Example 1")
    print("Input  -> severity='high', people_affected=150, near_sensitive_location=True")
    print(f"Output -> Priority: {result_1}\n")

    print("Example 2")
    print("Input  -> severity='low', people_affected=5, near_sensitive_location=False")
    print(f"Output -> Priority: {result_2}")

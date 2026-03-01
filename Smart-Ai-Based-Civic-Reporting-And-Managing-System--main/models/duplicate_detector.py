import math

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def normalize_text(text):
    """Normalize common complaint words so similar issues match better."""
    text = text.lower()

    # Basic synonym mapping for common complaint vocabulary
    replacements = {
        "trash": "garbage",
        "heap": "pile",
        "public": "",
    }

    for old_word, new_word in replacements.items():
        text = text.replace(old_word, new_word)

    return " ".join(text.split())


def calculate_text_similarity(text1, text2):
    """Calculate cosine similarity between two complaint texts using TF-IDF."""
    # Normalize text before vectorization for better semantic matching
    text1 = normalize_text(text1)
    text2 = normalize_text(text2)

    # Convert the two input texts into TF-IDF vectors
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([text1, text2])

    # Compute cosine similarity between the two vectors
    similarity_score = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0]
    return float(similarity_score)


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in kilometers between two GPS points using Haversine formula."""
    # Radius of Earth in kilometers
    earth_radius_km = 6371.0

    # Convert latitude/longitude from degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # Differences in coordinates
    delta_lat = lat2_rad - lat1_rad
    delta_lon = lon2_rad - lon1_rad

    # Haversine formula
    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance_km = earth_radius_km * c
    return distance_km


def is_duplicate(
    text1,
    text2,
    lat1,
    lon1,
    lat2,
    lon2,
    similarity_threshold=0.6,
    distance_threshold_km=1.0,
):
    """Check if two complaints are duplicates based on text and location thresholds."""
    # Calculate text similarity and geographic distance
    similarity = calculate_text_similarity(text1, text2)
    distance = calculate_distance(lat1, lon1, lat2, lon2)

    # A complaint pair is duplicate only if BOTH conditions are satisfied
    duplicate_flag = similarity >= similarity_threshold and distance <= distance_threshold_km

    # Return decision plus metrics for readability in outputs
    return duplicate_flag, similarity, distance


if __name__ == "__main__":
    print("Duplicate Complaint Detection Demo\n")

    # Example 1: Likely duplicate (similar text + nearby location)
    text_a1 = "Garbage pile near school"
    text_a2 = "Trash heap near public school"
    lat_a1, lon_a1 = 18.5204, 73.8567
    lat_a2, lon_a2 = 18.5210, 73.8572

    result1, sim1, dist1 = is_duplicate(
        text_a1,
        text_a2,
        lat_a1,
        lon_a1,
        lat_a2,
        lon_a2,
    )

    print("Example 1")
    print(f"Complaint 1: {text_a1}")
    print(f"Complaint 2: {text_a2}")
    print(f"Text Similarity: {sim1:.2f}")
    print(f"Distance (km): {dist1:.3f}")
    print(f"Duplicate: {result1}\n")

    # Example 2: Not duplicate (different text + farther location)
    text_b1 = "Water leakage"
    text_b2 = "Street light not working"
    lat_b1, lon_b1 = 18.5204, 73.8567
    lat_b2, lon_b2 = 18.6500, 73.9000

    result2, sim2, dist2 = is_duplicate(
        text_b1,
        text_b2,
        lat_b1,
        lon_b1,
        lat_b2,
        lon_b2,
    )

    print("Example 2")
    print(f"Complaint 1: {text_b1}")
    print(f"Complaint 2: {text_b2}")
    print(f"Text Similarity: {sim2:.2f}")
    print(f"Distance (km): {dist2:.3f}")
    print(f"Duplicate: {result2}")

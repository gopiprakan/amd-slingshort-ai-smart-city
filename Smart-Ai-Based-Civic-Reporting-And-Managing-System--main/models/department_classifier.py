import pickle

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression


def train_model():
    """Train a complaint department classifier and save artifacts."""
    # Step 1: Create a small labeled dataset for training
    text_samples = [
        "garbage not collected in my area",
        "trash overflow near road",
        "waste bins are full and smell bad",
        "garbage pile near apartment",
        "water leakage from pipe",
        "no water supply since morning",
        "water tank is empty in colony",
        "drinking water line broken",
        "street light not working",
        "power outage in area",
        "electric pole spark issue",
        "street lights are flickering at night",
        "pothole on main road",
        "road damaged badly after rain",
        "big cracks on the road",
        "road surface broken near junction",
        "drain water overflow"
        "sewer blockage"
        "drainage problem"
        "sewage water flooding"
        "storm water drain blocked"

    ]

    labels = [
        "Sanitation",
        "Sanitation",
        "Sanitation",
        "Sanitation",
        "Water Supply",
        "Water Supply",
        "Water Supply",
        "Water Supply",
        "Electrical",
        "Electrical",
        "Electrical",
        "Electrical",
        "Road Maintenance",
        "Road Maintenance",
        "Road Maintenance",
        "Road Maintenance",
        "Water Supply"
    ]

    # Step 2: Convert complaint text into TF-IDF feature vectors
    vectorizer = TfidfVectorizer()
    features = vectorizer.fit_transform(text_samples)

    # Step 3: Train a Logistic Regression classifier
    model = LogisticRegression(max_iter=1000)
    model.fit(features, labels)

    # Step 4: Evaluate model accuracy on training data
    accuracy = model.score(features, labels)
    print(f"Training accuracy: {accuracy:.2f}")

    # Step 5: Test model predictions on new complaint sentences
    test_sentences = [
        "Huge garbage pile near market",
        "Water pipe burst on street",
        "Street light flickering",
    ]

    print("\nSample predictions:")
    test_features = vectorizer.transform(test_sentences)
    predictions = model.predict(test_features)

    for sentence, prediction in zip(test_sentences, predictions):
        print(f"Complaint: {sentence}")
        print(f"Predicted Department: {prediction}\n")

    # Step 6: Save trained model to a pickle file
    with open("department_model.pkl", "wb") as model_file:
        pickle.dump(model, model_file)

    # Step 7: Save TF-IDF vectorizer to a pickle file
    with open("tfidf_vectorizer.pkl", "wb") as vectorizer_file:
        pickle.dump(vectorizer, vectorizer_file)

    print("Model saved to department_model.pkl")
    print("Vectorizer saved to tfidf_vectorizer.pkl")


if __name__ == "__main__":
    print("Starting department classification model training...")
    train_model()
    print("Training completed successfully.")

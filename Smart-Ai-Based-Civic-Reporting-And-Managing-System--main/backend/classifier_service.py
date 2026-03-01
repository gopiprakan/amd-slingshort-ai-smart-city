import pickle
from pathlib import Path

# Resolve project root path (Smart-City/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Possible locations for saved model files
MODEL_CANDIDATES = [
    PROJECT_ROOT / "department_model.pkl",
    PROJECT_ROOT / "models" / "department_model.pkl",
]
VECTORIZER_CANDIDATES = [
    PROJECT_ROOT / "tfidf_vectorizer.pkl",
    PROJECT_ROOT / "models" / "tfidf_vectorizer.pkl",
]


def _find_existing_path(candidates):
    """
    Return first existing file path from a candidate list.
    """
    for file_path in candidates:
        if file_path.exists():
            return file_path
    return None


def _load_classifier_assets():
    """
    Load trained department model and TF-IDF vectorizer.
    Returns tuple: (model, vectorizer)
    """
    model_path = _find_existing_path(MODEL_CANDIDATES)
    vectorizer_path = _find_existing_path(VECTORIZER_CANDIDATES)

    if model_path is None:
        print("Error: 'department_model.pkl' not found in project root or models folder.")
        return None, None
    if vectorizer_path is None:
        print("Error: 'tfidf_vectorizer.pkl' not found in project root or models folder.")
        return None, None

    try:
        with open(model_path, "rb") as model_file:
            model = pickle.load(model_file)

        with open(vectorizer_path, "rb") as vectorizer_file:
            vectorizer = pickle.load(vectorizer_file)

        return model, vectorizer
    except FileNotFoundError as error:
        print(f"Error: File not found while loading classifier assets: {error}")
    except Exception as error:
        print(f"Error: Could not load classifier assets: {error}")

    return None, None


# Load once when module is imported
MODEL, VECTORIZER = _load_classifier_assets()


def predict_department(text):
    """
    Predict department label from complaint text.
    """
    if MODEL is None or VECTORIZER is None:
        print("Prediction unavailable: model/vectorizer not loaded.")
        return None

    # Convert text into TF-IDF features and run model prediction
    text_features = VECTORIZER.transform([text])
    prediction = MODEL.predict(text_features)[0]
    return prediction


if __name__ == "__main__":
    # Sample complaints for quick testing
    sample_texts = [
        "garbage overflow near road",
        "water pipe leakage",
        "street light not working",
        "pothole on main road",
    ]

    print("Department Classification Test:\n")
    for complaint in sample_texts:
        department = predict_department(complaint)
        print(f"Complaint: {complaint}")
        print(f"Predicted Department: {department}\n")

from backend.services.intent_classifier import IntentClassifier


def run_test(test_input, language="en"):
    classifier = IntentClassifier()

    result = classifier.classify(
        user_input=test_input,
        language=language
    )

    print("--------------------------------------------------")
    print(f"Input: {test_input}")
    print(f"Language: {language}")
    print("Result:", result)


if __name__ == "__main__":

    print("\n===== PRODUCTION INTENT CLASSIFIER TEST =====\n")

    # -------------------------
    # 1️⃣ Strong Keyword Tests
    # -------------------------
    run_test("I want caste certificate", "en")
    run_test("मुझे जाति प्रमाणपत्र चाहिए", "hi")
    run_test("मला जात प्रमाणपत्र हवे आहे", "mr")

    # -------------------------
    # 2️⃣ Embedding Strong / Weak
    # -------------------------
    run_test("I need domicile proof", "en")
    run_test("आवास प्रमाणपत्र कैसे बनता है", "hi")
    run_test("रहिवासी प्रमाणपत्र कसे काढायचे", "mr")

    # -------------------------
    # 3️⃣ Generic Input Guard
    # -------------------------
    run_test("certificate", "en")
    run_test("apply", "en")
    run_test("help", "en")

    # -------------------------
    # 4️⃣ Random Noise
    # -------------------------
    run_test("This is completely unrelated text", "en")
    run_test("मुझे कुछ समझ नहीं आ रहा", "hi")

    # -------------------------
    # 5️⃣ Margin Conflict Simulation
    # -------------------------
    run_test("income and caste document", "en")

    print("\n===== TEST COMPLETE =====\n")
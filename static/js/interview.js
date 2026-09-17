// ==========================================
// HIRE GENIUS AI INTERVIEW
// ==========================================

let currentQuestion = "";
let scores = [];

let questionNumber = 0;
let totalQuestions = 6;

let time = 30;
let timerInterval = null;

let recognition = null;

let emotionInterval = null;
let faceModelsLoaded = false;


// ==========================================
// ELEMENTS
// ==========================================

const questionElement =
    document.getElementById("question");

const questionNumberElement =
    document.getElementById("questionNumber");

const timerElement =
    document.getElementById("timer");

const progressElement =
    document.getElementById("progress");

const answerButton =
    document.getElementById("answerBtn");

const startButton =
    document.getElementById("startInterview");

const voiceStatus =
    document.getElementById("voiceStatus");

const emotionElement =
    document.getElementById("emotionStatus");


// ==========================================
// START INTERVIEW
// ==========================================

async function startInterview() {

    startButton.disabled = true;

    answerButton.disabled = true;

    scores = [];

    questionNumber = 0;

    currentQuestion = "";

    voiceStatus.innerText =
        "Preparing your personalized AI interview...";


    try {

        // ----------------------------------
        // Start camera
        // ----------------------------------

        await startCamera();


        // ----------------------------------
        // Get first AI question
        // ----------------------------------

        const response =
            await fetch(
                "/api/interview/questions"
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to generate interview question."
            );
        }


        // ----------------------------------
        // Save first question
        // ----------------------------------

        currentQuestion =
            data.question;


        questionNumber = 1;


        // ----------------------------------
        // Show question
        // ----------------------------------

        showQuestion();


    }

    catch (error) {

        console.error(
            "Interview start error:",
            error
        );


        voiceStatus.innerText =
            error.message ||
            "Unable to start AI interview.";


        startButton.disabled =
            false;

        answerButton.disabled =
            true;
    }
}


// ==========================================
// SHOW QUESTION
// ==========================================

function showQuestion() {

    clearInterval(timerInterval);


    if (!currentQuestion) {

        questionElement.innerText =
            "No question generated.";

        return;
    }


    questionElement.innerText =
        currentQuestion;


    questionNumberElement.innerText =
        `Question ${questionNumber} / ${totalQuestions}`;


    voiceStatus.innerText =
        "AI is asking the question...";


    answerButton.disabled =
        true;


    // Speak question

    speak(currentQuestion);


    // Start timer after speaking

    setTimeout(() => {

        if (questionNumber <= totalQuestions) {

            answerButton.disabled =
                false;

            startTimer();
        }

    }, 1000);
}


// ==========================================
// TEXT TO SPEECH
// ==========================================

function speak(text) {

    if (!window.speechSynthesis) {

        return;
    }


    window.speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(text);


    speech.lang =
        "en-US";


    speech.rate =
        0.95;


    speech.pitch =
        1;


    speech.onend =
        function() {

            voiceStatus.innerText =
                "Your turn. Click Answer and speak.";

        };


    window.speechSynthesis.speak(
        speech
    );
}


// ==========================================
// TIMER
// ==========================================

function startTimer() {

    clearInterval(timerInterval);


    time = 30;


    updateTimer();


    timerInterval =
        setInterval(() => {

            time--;

            updateTimer();


            if (time <= 5) {

                timerElement.style.color =
                    "#ff4d6d";

            }

            else if (time <= 10) {

                timerElement.style.color =
                    "#ffb020";

            }

            else {

                timerElement.style.color =
                    "#00c6ff";
            }


            if (time <= 0) {

                clearInterval(
                    timerInterval
                );


                voiceStatus.innerText =
                    "Time over. Sending your answer...";


                answerButton.disabled =
                    true;


                // Empty answer gets evaluated as weak answer
                evaluateAnswer("");

            }

        }, 1000);
}


// ==========================================
// UPDATE TIMER
// ==========================================

function updateTimer() {

    timerElement.innerText =
        `Time Left: ${time}s`;


    const progress =
        ((30 - time) / 30) * 100;


    progressElement.style.width =
        progress + "%";
}


// ==========================================
// SPEECH RECOGNITION
// ==========================================

function listenAnswer() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        alert(
            "Speech recognition is not supported. Please use Google Chrome."
        );

        return;
    }


    if (!currentQuestion) {

        return;
    }


    recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-US";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    voiceStatus.innerText =
        "🎙️ Listening... Speak now.";


    answerButton.disabled =
        true;


    clearInterval(
        timerInterval
    );


    try {

        recognition.start();

    }

    catch (error) {

        console.error(
            "Recognition start error:",
            error
        );
    }


    recognition.onresult =
        async function(event) {

            const answer =
                event
                    .results[0][0]
                    .transcript;


            console.log(
                "Candidate Answer:",
                answer
            );


            voiceStatus.innerText =
                "Answer received. AI is evaluating...";


            await evaluateAnswer(
                answer
            );
        };


    recognition.onerror =
        function(event) {

            console.error(
                "Speech error:",
                event.error
            );


            voiceStatus.innerText =
                "Could not understand. Please try again.";


            answerButton.disabled =
                false;


            startTimer();
        };


    recognition.onend =
        function() {

            if (
                questionNumber <= totalQuestions &&
                currentQuestion
            ) {

                answerButton.disabled =
                    false;
            }

        };
}


// ==========================================
// SEND ANSWER TO FLASK + AI
// ==========================================

async function evaluateAnswer(answer) {

    try {

        clearInterval(
            timerInterval
        );


        answerButton.disabled =
            true;


        const response =
            await fetch(
                "/api/interview/answer",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        question:
                            currentQuestion,

                        answer:
                            answer

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to evaluate answer."
            );
        }


        // ----------------------------------
        // Save score
        // ----------------------------------

        scores.push(
            Number(data.score)
        );


        // ----------------------------------
        // Update UI
        // ----------------------------------

        updateScoreUI(
            data.score,
            data.feedback
        );


        console.log(
            "AI Feedback:",
            data.feedback
        );


        console.log(
            "Strengths:",
            data.strengths
        );


        console.log(
            "Improvement:",
            data.improvement
        );


        // ----------------------------------
        // Check interview completion
        // ----------------------------------

        if (data.done) {

            finishInterview();

            return;
        }


        // ----------------------------------
        // Get next AI question
        // ----------------------------------

        currentQuestion =
            data.next_question;


        questionNumber =
            data.question_number;


        totalQuestions =
            data.total_questions || 6;


        voiceStatus.innerText =
            "AI analyzed your answer. Preparing the next question...";


        setTimeout(() => {

            showQuestion();

        }, 2000);


    }

    catch (error) {

        console.error(
            "AI evaluation error:",
            error
        );


        voiceStatus.innerText =
            "Server error while evaluating your answer.";


        answerButton.disabled =
            false;
    }
}


// ==========================================
// UPDATE SCORE UI
// ==========================================

function updateScoreUI(
    score,
    feedback
) {

    const percentage =
        Number(score) * 10;


    const bars =
        document.querySelectorAll(
            ".analysis-bar div"
        );


    if (bars[0]) {

        bars[0].style.width =
            percentage + "%";
    }


    if (bars[1]) {

        bars[1].style.width =
            Math.min(
                percentage + 5,
                100
            ) + "%";
    }


    if (bars[2]) {

        bars[2].style.width =
            Math.min(
                percentage + 10,
                100
            ) + "%";
    }


    console.log(
        "Score:",
        score
    );


    console.log(
        "Feedback:",
        feedback
    );
}


// ==========================================
// FINISH INTERVIEW
// ==========================================

async function finishInterview() {

    clearInterval(
        timerInterval
    );


    if (scores.length === 0) {

        questionElement.innerText =
            "Interview Completed";

        voiceStatus.innerText =
            "No answers were recorded.";

        return;
    }


    // ----------------------------------
    // Calculate average
    // ----------------------------------

    let total = 0;


    scores.forEach(score => {

        total +=
            Number(score);

    });


    const average =
        (total / scores.length).toFixed(1);


    // ----------------------------------
    // Save result to Flask
    // ----------------------------------

    try {

        const response =
            await fetch(
                "/api/interview/complete",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        scores: scores
                    })
                }
            );


        const data =
            await response.json();


        console.log(
            "Final interview result:",
            data
        );

    }

    catch (error) {

        console.error(
            "Interview save error:",
            error
        );
    }


    // ----------------------------------
    // Performance
    // ----------------------------------

    let performance;


    if (average >= 8) {

        performance =
            "Excellent";

    }

    else if (average >= 6) {

        performance =
            "Good";

    }

    else if (average >= 4) {

        performance =
            "Average";

    }

    else {

        performance =
            "Needs Improvement";
    }


    // ----------------------------------
    // Update page
    // ----------------------------------

    questionElement.innerText =
        "🎉 Interview Completed";


    questionNumberElement.innerText =
        "Completed";


    voiceStatus.innerText =
        `Final Score: ${average} / 10`;


    const result =
        document.getElementById("result");


    if (result) {

        result.innerHTML = `
            <strong>Interview Completed 🎉</strong>
            <br><br>
            Score: ${average} / 10
            <br>
            Performance: ${performance}
        `;
    }


    speak(
        `Interview completed.
        Your average score is ${average}
        out of 10.
        Your performance is ${performance}.`
    );


    startButton.disabled =
        false;


    answerButton.disabled =
        true;
}


// ==========================================
// FACE EMOTION DETECTION
// ==========================================

async function loadFaceModels() {

    if (
        typeof faceapi ===
        "undefined"
    ) {

        console.error(
            "face-api.js is not loaded"
        );


        emotionElement.innerText =
            "Face AI not loaded";


        return false;
    }


    try {

        console.log(
            "Loading face models..."
        );


        await faceapi.nets.tinyFaceDetector.loadFromUri(
            "/static/models"
        );


        await faceapi.nets.faceExpressionNet.loadFromUri(
            "/static/models"
        );


        faceModelsLoaded =
            true;


        emotionElement.innerText =
            "Ready to detect 😊";


        console.log(
            "Face emotion models loaded successfully"
        );


        return true;

    }

    catch (error) {

        console.error(
            "Face model loading error:",
            error
        );


        emotionElement.innerText =
            "Face AI unavailable";


        return false;
    }
}


// ==========================================
// START CAMERA
// ==========================================

async function startCamera() {

    const video =
        document.getElementById("video");


    const placeholder =
        document.getElementById(
            "cameraPlaceholder"
        );


    if (!video) {

        console.error(
            "Video element not found"
        );

        return;
    }


    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    width: 640,
                    height: 480,
                    facingMode: "user"
                },

                audio: false
            });


        video.srcObject =
            stream;


        await video.play();


        if (placeholder) {

            placeholder.style.display =
                "none";
        }


        emotionElement.innerText =
            "Looking for face...";


        if (emotionInterval) {

            clearInterval(
                emotionInterval
            );
        }


        startEmotionDetection();

    }

    catch (error) {

        console.error(
            "Camera error:",
            error
        );


        emotionElement.innerText =
            "Camera unavailable";


        voiceStatus.innerText =
            "Please allow camera permission.";
    }
}


// ==========================================
// START EMOTION LOOP
// ==========================================

function startEmotionDetection() {

    if (!faceModelsLoaded) {

        console.warn(
            "Face models are not loaded"
        );


        emotionElement.innerText =
            "Face AI not ready";


        return;
    }


    if (emotionInterval) {

        clearInterval(
            emotionInterval
        );
    }


    detectFaceEmotion();


    emotionInterval =
        setInterval(
            detectFaceEmotion,
            700
        );
}


// ==========================================
// DETECT FACE EMOTION
// ==========================================

async function detectFaceEmotion() {

    const video =
        document.getElementById("video");


    if (!video) return;


    if (!faceModelsLoaded) return;


    if (
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
    ) {

        return;
    }


    try {

        const detection =
            await faceapi
                .detectSingleFace(
                    video,
                    new faceapi.TinyFaceDetectorOptions({

                        inputSize: 320,

                        scoreThreshold: 0.35

                    })
                )
                .withFaceExpressions();


        if (!detection) {

            emotionElement.innerText =
                "No face detected 😐";

            return;
        }


        const expressions =
            detection.expressions;


        let strongestEmotion =
            "neutral";


        let highestScore =
            0;


        for (
            const [emotion, score]
            of Object.entries(expressions)
        ) {

            if (
                score >
                highestScore
            ) {

                highestScore =
                    score;

                strongestEmotion =
                    emotion;
            }
        }


        const emotionNames = {

            neutral:
                "Neutral 😐",

            happy:
                "Happy 😊",

            sad:
                "Sad 😢",

            angry:
                "Angry 😠",

            fearful:
                "Fearful 😨",

            disgusted:
                "Disgusted 🤢",

            surprised:
                "Surprised 😮"
        };


        emotionElement.innerText =
            emotionNames[
                strongestEmotion
            ] ||
            "Detecting...";

    }

    catch (error) {

        console.error(
            "Emotion detection error:",
            error
        );
    }
}


// ==========================================
// BUTTON EVENTS
// ==========================================

if (startButton) {

    startButton.addEventListener(
        "click",
        startInterview
    );
}


if (answerButton) {

    answerButton.addEventListener(
        "click",
        listenAnswer
    );
}


// ==========================================
// DOWNLOAD REPORT
// ==========================================

const downloadButton =
    document.getElementById(
        "downloadReport"
    );


if (downloadButton) {

    downloadButton.addEventListener(
        "click",
        function() {

            window.location.href =
                "/download_report";

        }
    );
}


// ==========================================
// INITIAL STATE
// ==========================================

if (answerButton) {

    answerButton.disabled =
        true;
}


// ==========================================
// INITIALIZE FACE AI
// ==========================================

async function initializeInterview() {

    await loadFaceModels();

}


initializeInterview();
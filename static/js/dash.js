document.addEventListener("DOMContentLoaded", function () {

    /* ===============================
       TODAY'S DATE
    =============================== */

    const todayDate = document.getElementById("todayDate");

    if (todayDate) {

        const today = new Date();

        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        };

        todayDate.textContent =
            today.toLocaleDateString("en-US", options);
    }


    /* ===============================
       RESUME FILE SELECTION
    =============================== */

    const resumeInput = document.getElementById("resume");
    const fileName = document.getElementById("fileName");

    if (resumeInput && fileName) {

        resumeInput.addEventListener("change", function () {

            if (this.files && this.files.length > 0) {

                const selectedFile = this.files[0];

                fileName.textContent =
                    "📄 " + selectedFile.name;

                fileName.classList.add("selected");

            } else {

                fileName.textContent =
                    "No file selected";

                fileName.classList.remove("selected");
            }
        });
    }


    /* ===============================
       ATS SCORE CIRCLE
    =============================== */

    const progressCircle =
        document.getElementById("scoreProgress");

    const scoreCounter =
        document.getElementById("scoreCounter");

    let score =
        Number(window.ATS_SCORE || 0);

    if (isNaN(score)) {
        score = 0;
    }

    score = Math.max(0, Math.min(100, score));


    if (progressCircle && scoreCounter) {

        const radius = 65;

        const circumference =
            2 * Math.PI * radius;

        progressCircle.style.strokeDasharray =
            circumference;

        progressCircle.style.strokeDashoffset =
            circumference;

        let current = 0;

        const duration = 1200;

        const startTime = performance.now();


        function animateScore(currentTime) {

            const elapsed =
                currentTime - startTime;

            const progress =
                Math.min(elapsed / duration, 1);

            current =
                Math.round(score * progress);

            scoreCounter.textContent =
                current;

            const offset =
                circumference -
                (current / 100) * circumference;

            progressCircle.style.strokeDashoffset =
                offset;


            if (progress < 1) {

                requestAnimationFrame(
                    animateScore
                );

            } else {

                scoreCounter.textContent =
                    score;
            }
        }


        requestAnimationFrame(
            animateScore
        );
    }


    /* ===============================
       LOADER
    =============================== */

    window.showLoader = function () {

        const loader =
            document.getElementById("loader");

        if (loader) {
            loader.style.display = "flex";
        }
    };

});
let totalTime = 30;
let time = totalTime;
let timerInterval = null;

/* Start Timer */

function startTimer(){

stopTimer();   // prevent multiple timers

time = totalTime;

updateTimerUI();

timerInterval = setInterval(() => {

time--;

updateTimerUI();

/* Warning colors */

let timerElement = document.getElementById("timer");

if(time <= 5){
timerElement.style.color = "red";
speakWarning("Five seconds remaining");
}
else if(time <= 10){
timerElement.style.color = "orange";
}
else{
timerElement.style.color = "#00ffcc";
}

/* Time finished */

if(time <= 0){

stopTimer();

timerElement.innerText = "Time Over ⏱️";

/* Next Question */

if(typeof index !== "undefined"){
index++;
}

setTimeout(() => {

if(typeof askQuestion === "function"){
askQuestion();
}

},2000);

}

},1000);

}

/* Stop Timer */

function stopTimer(){

if(timerInterval !== null){

clearInterval(timerInterval);

timerInterval = null;

}

}

/* Reset Timer */

function resetTimer(){

stopTimer();

time = totalTime;

updateTimerUI();

}

/* Update UI */

function updateTimerUI(){

document.getElementById("timer").innerText = "Time Left: " + time + "s";

let progress = ((totalTime - time) / totalTime) * 100;

document.getElementById("progress").style.width = progress + "%";

}

/* Voice Warning */

function speakWarning(text){

if(!window.speechSynthesis) return;

let speech = new SpeechSynthesisUtterance(text);

speech.rate = 1;
speech.pitch = 1;

window.speechSynthesis.speak(speech);

}

const resumeInput = document.getElementById("resume");
const uploadLabel = document.querySelector(".upload-label");
const fileName = document.getElementById("fileName");

uploadLabel.onclick = function () {
    resumeInput.click();
};

resumeInput.addEventListener("change", function () {

    if (this.files.length > 0) {

        fileName.innerHTML = "📄 " + this.files[0].name;

    } else {

        fileName.innerHTML = "No file selected";

    }

});
const fileInput = document.getElementById("resume");
const fileLabel = document.getElementById("fileLabel");

fileInput.addEventListener("change", function(){

    if(this.files.length > 0){

        fileLabel.innerHTML =
        "✅ " + this.files[0].name;

    }

});

const score = Number('{{ score|default(0) }}');
const progress = document.querySelector(".score-card .progress");
const counter = document.getElementById("scoreCounter");

if (progress) {

    const radius = 70;
    const circumference = 2 * Math.PI * radius;

    progress.style.strokeDasharray = circumference;
    progress.style.strokeDashoffset = circumference;

    let current = 0;

    const timer = setInterval(() => {

        if (current >= score) {
            clearInterval(timer);
            return;
        }

        current++;

        counter.innerHTML = current;

        progress.style.strokeDashoffset =
            circumference - (current / 100) * circumference;

    }, 20);
}

function showLoader() {
    document.getElementById("loader").style.display = "flex";
}
const options = {
    weekday:'long',
    year:'numeric',
    month:'long',
    day:'numeric'
};

document.getElementById("todayDate").innerHTML =
new Date().toLocaleDateString("en-US", options);

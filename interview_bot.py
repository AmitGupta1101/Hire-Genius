import pyttsx3
import speech_recognition as sr

engine = pyttsx3.init()

# Interview Questions
questions = [
"Tell me about yourself",
"What is Python?",
"What are the features of Python?",
"What is Machine Learning?",
"What is the difference between AI and Machine Learning?",
"What are your strengths?",
"What are your weaknesses?",
"Why should we hire you?",
"Where do you see yourself in five years?",
"What is Object Oriented Programming?",
"What are the four pillars of OOP?",
"What is the difference between list and tuple in Python?",
"What is a dictionary in Python?",
"What is a class and object?",
"What is inheritance?",
"What is polymorphism?",
"What is encapsulation?",
"What is database?",
"What is SQL?",
"What is the difference between process and thread?",
"Explain your final year project",
"What technologies did you use in your project?",
"What challenges did you face in your project?",
"Why do you want to join our company?"
]

def speak(text):
    engine.say(text)
    engine.runAndWait()

def listen():

    r = sr.Recognizer()

    with sr.Microphone() as source:
        print("Listening...")
        audio = r.listen(source)

    try:
        text = r.recognize_google(audio)
        print("Candidate:", text)
        return text

    except:
        print("Could not understand")
        return ""

def start_interview():

    speak("Welcome to AI Mock Interview")

    for q in questions:

        print("Question:", q)

        speak(q)

        answer = listen()

        if answer == "":
            speak("Please repeat your answer")

    speak("Interview completed. Thank you.")

if __name__ == "__main__":
    start_interview()
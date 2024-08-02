from fastapi import FastAPI
import nltk
from fastapi.middleware.cors import CORSMiddleware
from dataclasses import dataclass
from pygoogletranslation import Translator
import requests
import os
from dotenv import load_dotenv
import openai
import re

load_dotenv()

nltk.download('punkt')

app = FastAPI()
# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=False,
    allow_methods=["POST"],
    allow_headers=["Content-Type", "Authorization"],
)

@dataclass
class ChatgptModel:
    data: str
    numQues:int
    lang:str
    selection:str

def classify_assignment(text: str) -> str:
    maths_keywords = [
        "find the remainder",
        "solve", "calculate", "equation", "theorem", "algebra", "geometry",
        "arithmetic", "trigonometry", "calculus", "word problems", "simplify",
        "solve for x", "find the area", "compute", "fraction", "decimal", 
        "integer", "quadratic", "polynomial", "matrix", "find the value","division",
        "compute the result", "solve the problem", "derive the formula", 
        "evaluate"
    ]
    
    # Convert text to lowercase for case-insensitive comparison
    text_lower = text.lower()

    # Check for maths keywords
    if any(keyword in text_lower for keyword in maths_keywords):
        return "maths"

    # If no keywords are found, return "unknown"
    return "unknown"




# Function to call the OpenAI API
def callApi(input):
    openai.api_key=os.getenv('OPENAI_API_KEY') 
    try:
        response = openai.Completion.create(
        model="gpt-3.5-turbo-instruct",
        # prompt=,
        prompt=f"{input}",
        temperature=0.4,
        max_tokens=2000,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0
        )
        return(response.choices[0].text.strip())
       
    except requests.exceptions.RequestException as e:
        return {'error': str(e)}, 500
    except (e):
        return str(e)


# Endpoint to handle chat requests
@app.post("/chatgpt")
def create_message(data: ChatgptModel):
    translator = Translator()
    extracted_text = data.data
    num_questions = data.numQues
    language = data.lang
    question_type = data.selection

    if not extracted_text:
        return ["No text provided for question generation."]

    if question_type == 'grammar':
        return handle_grammar_questions(extracted_text, num_questions, language, translator)
    elif question_type == 'maths':
        return handle_maths_questions(extracted_text, language, translator)
    else:
        return handle_general_questions(extracted_text, num_questions, language, translator)
    


    

def handle_grammar_questions(text: str, num_questions: int, language: str, translator: Translator):
    question_counts = len(re.findall(r'[A-Z]\.', text))
    questions = re.findall(r'[A-Z]\.', text)

    if question_counts == 0:
        return ["Given text is not suitable to generate grammar practice"]

    res1 = [i for i in range(len(text)) if text.startswith('1.', i)]
    res2 = [i for i in range(len(text)) if text.startswith('2.', i)]

    if len(res1) < question_counts or len(res2) < question_counts:
        return ["Given text is not suitable to generate grammar practice"]

    prompt_questions = []
    prompt_examples = []

    for i in range(question_counts):
        stmt1 = text.index(questions[i])
        prompt_questions.append(text[stmt1:res1[i]])
        prompt_examples.append(text[res1[i]:res2[i]])

    results = []
    for i in range(len(prompt_questions)):
        prompt = f"You are required to generate only {num_questions} practice questions in {language} for {prompt_questions[i]} with their answers. For Example-{prompt_examples[i]}, do not give solution for example."
        translated_prompt_question = translator.translate(prompt_questions[i], src='auto', dest=language).text
        translated_output = translator.translate(callApi(prompt),src='auto', dest=language).text
        results.append(f"{translated_prompt_question}\n\n{translated_output}")

    return results



def handle_maths_questions(text: str, language: str, translator: Translator):
    if classify_assignment(text) != 'maths':
        return ["Given text is not suitable to generate maths practice"]

    results = []
    page_content = text.split('\n\n')

    for page in page_content[:-1]:
        prompt = f"You have to generate another worksheet (with different numerical values).\nNote-('Give new questions (corrosponding to same topic)  for those which dont have any numerical value').\nAdditional Note-('Also provide answer key'). \nfor example-({page})"
        response = callApi(prompt)
        translated_output = translator.translate(response, src='auto',dest=language).text
        results.append(translated_output)

    return results


def handle_general_questions(text: str, num_questions: int, language: str, translator: Translator):
    results = []
    page_content = text.split('\n\n')
    for i in range(num_questions):
        prompt = f"You have to generate 1 question along with its answer from {page_content[i % (len(page_content)-1)]}. (Note: Don't give translations in English for the response generated)"
        response = callApi(prompt)
        translated_output = translator.translate(response, src='auto',dest=language).text
        results.append(translated_output)

    return results


    
    

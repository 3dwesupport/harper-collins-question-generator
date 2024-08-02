'use client';
import { Box, Button, Typography, Input, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { CircularProgress } from '@mui/material';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import React, { useState } from 'react';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { extractTextFromPdf } from './utils/pdfUtils';
import axios from 'axios';


export default function HomePage() {
  const [textContent, setTextContent] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [numQuestions, setNumQuestions] = useState(1);
  const [language, setLanguage] = useState('en');
  const [selection, setSelection] = useState('');
  const [errorMessage, setErrorMessage] = useState('');


  //File change handler for file input
  const handleFileChange = async (event) => {
    setGeneratedQuestions('')
    setErrorMessage('')
    setTextContent(null)
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      const text = await extractTextFromPdf(file);
      setTextContent(text);
    } else {
      alert('Please select a valid PDF file.');
      event.target.value = null
    }
  };

  const handleSelectionChange = (event) => {
    setSelection(event.target.value);
  };

  const handleGenerateQuestions = async () => {
    setLoading(true);
    setGeneratedQuestions('');
    setErrorMessage('');
    try {
      const body = {
        data: textContent,
        numQues: numQuestions,
        lang: language,
        selection: selection,
      }
      const response = await axios.post('http://127.0.0.1:8000/chatgpt', body)

      if (response.data.includes('Given text is not suitable to generate grammar practice') || response.data.includes('Given text is not suitable to generate maths practice')) {
        setErrorMessage(response.data);
      } else {
        setGeneratedQuestions(response.data);
      }

      setLoading(false)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div>
      <Box display="flex" flexDirection="column" alignItems="center" p={2}>
        {/* Title */}
        <Typography variant="h4" gutterBottom>
          Questionify
        </Typography>

        {/* File Upload */}
        <Input type="file" onChange={handleFileChange} accept="application/pdf" style={{ marginTop: 20 }} disabled={loading} />


        {/* Configuration Section */}
        <Box display="flex" flexDirection="column" alignItems="center" style={{ marginTop: 20, width: '100%', maxWidth: 400 }}>
          {/* Action Selection */}
          <FormControl fullWidth style={{ marginTop: 20 }}>
            <InputLabel>Choose Action</InputLabel>
            <Select
              value={selection}
              onChange={handleSelectionChange}
              label="Choose Action"
              disabled={textContent === null || loading}
            >
              <MenuItem value="questions">Generate Questions from Text</MenuItem>
              <MenuItem value="grammar">Generate English Grammar Practice</MenuItem>
              <MenuItem value="maths">Generate Maths Practice</MenuItem>
            </Select>
          </FormControl>

          {/* Language Selection */}
          <FormControl fullWidth style={{ marginTop: 20 }}>
            <InputLabel id="language-select-label">Language</InputLabel>
            <Select
              labelId="language-select-label"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={textContent === null || loading}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
              <MenuItem value="fr">French</MenuItem>
              <MenuItem value="de">German</MenuItem>
              <MenuItem value="hi">Hindi</MenuItem>
              {/* Add more languages as needed */}
            </Select>
          </FormControl>

          {/* Number of Questions */}
          {selection === 'grammar' || selection === 'questions' ? (
            <TextField
              label="Number of Questions"
              type="number"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              inputProps={{ min: 1 }}
              fullWidth
              style={{ marginTop: 20 }}
              disabled={textContent === null || loading}
            />
          ) : null}
        </Box>

        {/* Action Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateQuestions}
          style={{ marginTop: 20 }}
          disabled={textContent === null || loading || selection === ''}
        >
          {selection === 'grammar' ? 'Generate English Grammar Practice' : selection === 'maths' ? 'Generate Maths practice' : 'Generate Questions'}
        </Button>

        {/* Loading Indicator */}
        {loading && (
          <div className='text-blue-500 mt-4' style={{ marginTop: 20 }}>
            <CircularProgress />
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Typography color="error" style={{ marginTop: 20 }}>
            {errorMessage}
          </Typography>
        )}

        {/* Results */}
        <Box mt={4} width="100%" maxWidth={800}>
          {generatedQuestions.length > 0 && (
            <Box>
              <Typography variant="h6">Generated Questions:</Typography>
              {generatedQuestions.map((question, index) => (
                <pre
                  key={index}
                  style={{
                    backgroundColor: index % 2 === 0 ? 'rgb(196,221,255)' : 'white',
                    padding: '15px',
                    border: '1.5px solid black',
                    borderRadius: '15px',
                    marginTop: '20px',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    fontFamily: 'Noto Sans Devanagari, sans-serif',
                  }}
                >
                  {question.replace(/^\s+|\s+$/g, '')}
                </pre>
              ))}
            </Box>
          )}
        </Box>

      </Box>
    </div>
  );

}





"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Bot, Loader2, Send } from "lucide-react";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AssessmentBotProps {
  safetyTestId: string | undefined;
  equipmentId: string | undefined; // equipmentId can still be optional for the bot's general use
  manualUrl?: string | null;
  documentTitle: string;
  onComplete?: (equipmentId?: string) => void;
  // onRecordAttempt now expects equipmentId to be a string, matching the server action
  onRecordAttempt: (safetyTestId: string | undefined, equipmentId: string | undefined, score: number, totalQuestions: number) => Promise<{ success: boolean; message: string }>;
  open: boolean; // Added open prop
}

type QuizState = 'idle' | 'loading' | 'quiz' | 'finished' | 'error';

type QuizQA = { question: string; options: string[]; answer: string; explanation: string };

export function AssessmentBot({
  safetyTestId,
  equipmentId,
  manualUrl,
  documentTitle,
  onComplete,
  onRecordAttempt,
}: AssessmentBotProps) {
  const [state, setState] = useState<QuizState>('idle');
  const [questions, setQuestions] = useState<QuizQA[]>([]);
  const [answers, setAnswers] = useState<{ user: string; correct: boolean }[]>([]);
  const [current, setCurrent] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [clarification, setClarification] = useState('');
  const [clarifyResponse, setClarifyResponse] = useState('');
  const [loadingClarify, setLoadingClarify] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (open && state === 'idle') {
      startQuizInternal();
    } else if (!open && state !== 'idle') {
      // Reset state when bot is closed
      setState('idle');
      setQuestions([]);
      setAnswers([]);
      setCurrent(0);
      setUserAnswer('');
      setShowExplanation(false);
      setScore(null);
      setFeedback('');
      setClarification('');
      setClarifyResponse('');
      setLoadingClarify(false);
      setError('');
    }
  }, [open]);

  // Helper function to parse questions from Gemini's response
  const parseQuestions = (text: string): QuizQA[] => {
    const questions: QuizQA[] = [];
    // Regex to capture each question block
    const questionRegex = /\*\*Q(\d+)\.\s*([\s\S]*?)\n(A\.[\s\S]*?)\n(B\.[\s\S]*?)\n(C\.[\s\S]*?)\n(D\.[\s\S]*?)\n\*\*Answer:\s*([A-D])\*\*\s*([\s\S]*?(?=\*\*Q\d+\.|\n\n|$))/g;

    let match;
    while ((match = questionRegex.exec(text)) !== null) {
      const [, , questionText, optionA, optionB, optionC, optionD, answerLetter, explanationText] = match;

      const options = [
        optionA.substring(2).trim(),
        optionB.substring(2).trim(),
        optionC.substring(2).trim(),
        optionD.substring(2).trim(),
      ];

      questions.push({
        question: questionText.trim(),
        options: options,
        answer: answerLetter.trim(),
        explanation: explanationText.trim(),
      });
    }
    return questions;
  };

  // Helper function to format clarification response
  const formatClarificationResponse = (text: string): string => {
    // Basic markdown to HTML conversion for display
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/^- (.*)$/gm, '<li>$1</li>') // List items
      .replace(/(\n|^)(#+)\s*(.*)/g, (match, newline, hashes, content) => {
        const level = hashes.length;
        return `${newline}<h${level}>${content}</h${level}>`;
      }) // Headers
      .replace(/\n/g, '<br />'); // Newlines
  };

  // Internal quiz starter with retry logic
  const startQuizInternal = async (retryCount = 0) => {
    setState('loading');
    setQuestions([]);
    setCurrent(0);
    setError('');

    try {
      const res = await fetch('/api/openai-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safetyTestId,
          equipmentId,
          manualUrl,
          documentTitle,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "An unknown error occurred." }));
        setError(errorData.error || `Server error: ${res.status}`);
        setState('error');
        return;
      }

      const data = await res.json();

      const content = data.result?.choices?.[0]?.message?.content;
 
      if (!content) {
        setError('Unable to generate assessment. The response was empty.');
        setState('error');
        return;
      }

      const parsed = parseQuestions(content);
      if (!parsed || !Array.isArray(parsed) || parsed.length < 1) {
        setError('No valid questions could be generated from this SOP manual.');
        setState('error');
        return;
      }

      setQuestions(parsed);
      setState('quiz');
      setError('');
      setCurrent(0);
      setAnswers([]);
      setScore(null);
      setFeedback('');
      setShowExplanation(false);
      setUserAnswer('');
      setClarification('');
      setClarifyResponse('');
      setLoadingClarify(false);

      if (parsed.length < 3 && retryCount < 2) {
        console.log(`Only ${parsed.length} questions parsed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return startQuizInternal(retryCount + 1);
      }

      if (parsed.length < 3) {
        throw new Error('Unable to generate sufficient questions. The document may be too short.');
      }

    } catch (e: any) {
      console.error('Quiz generation error:', e);
      setError(e.message || 'An error occurred while generating the quiz.');
      setState('error');
    }
  };

  const submitAnswer = () => {
    if (!userAnswer) return;

    const currentQuestion = questions[current];
    const isCorrect = userAnswer === currentQuestion.answer;

    setAnswers(prev => [...prev, { user: userAnswer, correct: isCorrect }]);
    setShowExplanation(true);
  };

  const nextQuestion = async () => {
    setShowExplanation(false);
    setUserAnswer('');
    setClarifyResponse(''); // Clear clarification response for next question

    if (current < questions.length - 1) {
      setCurrent(prev => prev + 1);
    } else {
      // Quiz finished
      const finalScore = answers.filter(a => a.correct).length;
      setScore(finalScore);
      setState('finished');

      // Record safety test attempt via prop
      if (safetyTestId || equipmentId) { // Record if either safetyTestId or equipmentId is available
        try {
          const result = await onRecordAttempt(safetyTestId, equipmentId, finalScore, questions.length);
          console.log('✅ Safety test attempt recorded successfully.', result);
          if (result.success) {
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        } catch (error) {
          console.error("Failed to record safety test attempt:", error);
          toast.error("Failed to record safety test attempt.");
        }
      } else {
        console.warn("Skipping recording safety test attempt: Neither safetyTestId nor equipmentId is present.");
        toast.info("Assessment completed, but attempt not recorded as neither safety test ID nor equipment ID was present.");
      }
    }
  };

  const askClarification = async () => {
    if (!clarification.trim()) return;

    setLoadingClarify(true);
    setClarifyResponse('');
    setError('');

    try {
      const res = await fetch('/api/openai-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safetyTestId,
          equipmentId,
          manualUrl,
          documentTitle,
          userMessage: clarification,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || `Server error: ${res.status}`);
        setLoadingClarify(false);
        return;
      }

      const data = await res.json();
      const responseText = data.result?.choices?.[0]?.message?.content;

      if (!responseText) {
        setError('Unable to get clarification. Please try again.');
        setLoadingClarify(false);
        return;
      }

      setClarifyResponse(responseText);
      setClarification('');
    } catch (e: any) {
      console.error('Clarification error:', e);
      setError(e.message || 'An error occurred while getting clarification.');
    } finally {
      setLoadingClarify(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border">
      {state === 'idle' && (
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bot className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Safety Knowledge Assessment</h2>
            <p className="text-gray-600 mb-4">Test your understanding of this SOP manual with an AI-generated quiz.</p>
            <Button onClick={() => startQuizInternal()} size="lg" className="mt-4">
              Start Assessment
            </Button>
          </div>
        </div>
      )}

      {state === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
          <p className="text-gray-600">Generating assessment questions...</p>
        </div>
      )}

      {state === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 mb-4">{error || 'Failed to generate assessment.'}</p>
          <Button onClick={() => startQuizInternal()} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {state === 'quiz' && questions.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Question {current + 1} of {questions.length}</h3>
            <div className="text-sm text-gray-500">
              {Math.round(((current + 1) / questions.length) * 100)}% Complete
            </div>
          </div>
          <Progress value={((current + 1) / questions.length) * 100} className="mb-6" />

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="font-medium mb-4">{questions[current].question}</p>

            <div className="space-y-3">
              {questions[current].options.map((option, index) => {
                const letter = String.fromCharCode(65 + index);
                const isSelected = userAnswer === letter;
                const isCorrect = showExplanation && letter === questions[current].answer;

                return (
                  <button
                    key={letter}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${isSelected
                        ? 'bg-blue-50 border-blue-300'
                        : isCorrect
                          ? 'bg-green-50 border-green-300'
                          : 'hover:bg-gray-100 border-gray-200'
                      }`}
                    onClick={() => !showExplanation && setUserAnswer(letter)}
                    disabled={showExplanation}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${isSelected
                          ? 'bg-blue-100 text-blue-700'
                          : isCorrect
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                        {letter}
                      </div>
                      {option}
                    </div>
                  </button>
                );
              })}
            </div>

            {!showExplanation ? (
              <Button
                onClick={submitAnswer}
                disabled={!userAnswer}
                className="w-full mt-6"
              >
                Submit Answer
              </Button>
            ) : (
              <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
                <div className={`font-medium mb-2 ${userAnswer === questions[current].answer ? 'text-green-700' : 'text-red-700'
                  }`}>
                  {userAnswer === questions[current].answer ? 'Correct!' : 'Incorrect'}
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  {questions[current].explanation}
                </p>
                <Button
                  onClick={nextQuestion}
                  className="w-full"
                >
                  {current < questions.length - 1 ? 'Next Question' : 'View Results'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {state === 'finished' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete!</h2>
            <p className="text-gray-600 mb-6">
              You scored {answers.filter(a => a.correct).length} out of {questions.length} questions correctly.
            </p>

            <div className="mb-8">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${(answers.filter(a => a.correct).length / questions.length) * 100}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>0%</span>
                <span>
                  {Math.round((answers.filter(a => a.correct).length / questions.length) * 100)}%
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Question Review</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${answers[i]?.correct
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${answers[i]?.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                      {answers[i]?.correct ? '✓' : '✗'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{q.question}</p>
                      <div className="mt-2 text-sm text-gray-600">
                        <p className={answers[i]?.correct ? 'text-green-700' : 'text-red-700'}>
                          {answers[i]?.correct
                            ? 'You answered correctly'
                            : `Your answer: ${answers[i]?.user} | Correct: ${q.answer}`
                          }
                        </p>
                        {!answers[i]?.correct && (
                          <p className="mt-1 text-gray-700">{q.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold text-gray-900 mb-3">Need clarification?</h3>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ask a question about the SOP..."
                value={clarification}
                onChange={(e) => setClarification(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && askClarification()}
                disabled={loadingClarify}
              />
              <Button
                onClick={askClarification}
                disabled={!clarification.trim() || loadingClarify}
                variant="outline"
              >
                {loadingClarify ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {clarifyResponse && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: formatClarificationResponse(clarifyResponse) }} />
              </div>
            )}
          </div>

          <div className="pt-4">
            <Button
              onClick={() => {
                if (onComplete) onComplete(equipmentId);
                setOpen(false);
              }}
              className="w-full"
            >
              Finish Assessment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

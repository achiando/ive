"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { extractTextFromDocument } from "@/lib/utils/document-text-extractor";
import { ManualType } from "@prisma/client";
import { AlertCircle, Bot, Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AssessmentBotProps {
  safetyTestId: string | undefined;
  equipmentId: string | undefined; 
  manualUrl?: string | null;
  manualType?: ManualType; // New prop
  documentTitle: string;
  onComplete?: (equipmentId?: string) => void;
  onRecordAttempt: (safetyTestId: string | undefined, equipmentId: string | undefined, score: number, totalQuestions: number) => Promise<{ success: boolean; message: string }>;
  open: boolean;
}

type QuizState = 'idle' | 'loading' | 'quiz' | 'finished' | 'error';

type QuizQA = { question: string; options: string[]; answer: string; explanation: string };



export function AssessmentBot({
  safetyTestId,
  equipmentId,
  manualUrl,
  manualType,
  documentTitle,
  onComplete,
  onRecordAttempt,
  open,
}: AssessmentBotProps) {
  const router = useRouter();
  const [state, setState] = useState<QuizState>('idle');
  const [questions, setQuestions] = useState<QuizQA[]>([]);
  const [answers, setAnswers] = useState<{ user: string; correct: boolean }[]>([]);
  const [current, setCurrent] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [clarification, setClarification] = useState('');
  const [clarifyResponse, setClarifyResponse] = useState('');
  const [loadingClarify, setLoadingClarify] = useState(false);
  const [error, setError] = useState('');
  console.log("Manual URL:", manualUrl);
  console.log("Manual Type:", manualType);
  console.log("Document Title:", documentTitle);
  console.log("Safety Test ID:", safetyTestId);
  console.log("Equipment ID:", equipmentId);

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
      setClarification('');
      setClarifyResponse('');
      setLoadingClarify(false);
      setError('');
    }
  }, [open, state]);

  const parseQuestions = (text: string): QuizQA[] => {
    const questions: QuizQA[] = [];
    const questionRegex = /\*\*Q(\d+)\.\s*([\s\S]*?)\n(A\.[\s\S]*?)\n(B\.[\s\S]*?)\n(C\.[\s\S]*?)\n(D\.[\s\S]*?)\n\*\*Answer:\s*([A-D])\*\*\s*([\s\S]*?(?=\*\*Q\d+\.|\n\n|$))/g;
    let match;
    while ((match = questionRegex.exec(text)) !== null) {
      const [, , questionText, optionA, optionB, optionC, optionD, answerLetter, explanationText] = match;
      questions.push({
        question: questionText.trim().replace(/\*\*/g, ''),
        options: [
          optionA.substring(2).trim(),
          optionB.substring(2).trim(),
          optionC.substring(2).trim(),
          optionD.substring(2).trim(),
        ],
        answer: answerLetter.trim(),
        explanation: explanationText.trim(),
      });
    }
    return questions;
  };

  const formatClarificationResponse = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*)$/gm, '<li>$1</li>')
      .replace(/(\n|^)(#+)\s*(.*)/g, (match, newline, hashes, content) => {
        const level = hashes.length;
        return `${newline}<h${level}>${content}</h${level}>`;
      })
      .replace(/\n/g, '<br />');
  };

  const startQuizInternal = async (retryCount = 0) => {
    setState('loading');
    setQuestions([]);
    setCurrent(0);
    setError('');
    setAnswers([]);
    setScore(null);
    setShowExplanation(false);
    setUserAnswer('');
    setClarifyResponse('');
    setClarification('');

    try {
      let manualText = '';
      if (manualUrl && manualType && (manualType === ManualType.LINK || manualType === ManualType.PDF)) {
        // manualText = await fetchManualText(manualUrl);
        manualText = await extractTextFromDocument(manualUrl);
        console.log("Manual text:", manualText);
      } else if (manualType === ManualType.VIDEO) {
        // For videos, we don't extract text. The API should rely on documentTitle/equipmentId.
        manualText = `Video manual for: ${documentTitle}`;
      } else {
        // Fallback for other types or if manualUrl/manualType is missing
        manualText = `Manual for: ${documentTitle}`;
      }

      const res = await fetch('/api/openai-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safetyTestId,
          equipmentId,
          manualText,
          documentTitle,
        }),
      });
      console.log("API response:", res);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "An unknown error occurred." }));
        console.log("Error data:", errorData);
        setError(errorData.error || `Server error: ${res.status}`);
        return;
      }

      const data = await res.json();
      console.log("API response:", data);
      const content = data.result?.choices?.[0]?.message?.content;
      console.log("Content:", content);

      if (!content) {
        setError('Unable to generate assessment. The response was empty.');
        setState('error');
        return;
      }

      const parsed = parseQuestions(content);
      if (!parsed || parsed.length < 1) {
        if (retryCount < 2) {
          console.log("Parsing failed or returned no questions, retrying...");
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return startQuizInternal(retryCount + 1);
        }
        setError('No valid questions could be generated from this SOP manual.');
        setState('error');
        return;
      }

      setQuestions(parsed);
      setState('quiz');
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
    setClarifyResponse('');

    if (current < questions.length - 1) {
      setCurrent(prev => prev + 1);
    } else {
      const finalScore = answers.filter(a => a.correct).length;
      setScore(finalScore);
      setState('finished');

      if ((finalScore / questions.length) * 100 >= 70) {
        if (safetyTestId || equipmentId) {
          try {
            const result = await onRecordAttempt(safetyTestId, equipmentId, finalScore, questions.length);
            if (result.success) {
              toast.success(result.message);
            } else {
              toast.error(result.message);
            }
          } catch (error) {
            console.error("Failed to record safety test attempt:", error);
            toast.error("Failed to record safety test attempt.");
          }
        }
      }
    }
  };

  const askClarification = async () => {
    if (!clarification.trim()) return;
    setLoadingClarify(true);
    setClarifyResponse('');
    setError('');
    try {
      let manualText = '';
      if (manualUrl && (manualType === ManualType.LINK || manualType === ManualType.PDF)) {
        manualText = await extractTextFromDocument(manualUrl);
      } else if (manualType === ManualType.VIDEO) {
        manualText = `Video manual for: ${documentTitle}`;
      } else {
        manualText = `Manual for: ${documentTitle}`;
      }

      const res = await fetch('/api/openai-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safetyTestId,
          equipmentId,
          manualText,
          documentTitle,
          userMessage: clarification,
        }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const responseText = data.result?.choices?.[0]?.message?.content;
      if (!responseText) throw new Error('Unable to get clarification.');
      setClarifyResponse(responseText);
      setClarification('');
    } catch (e: any) {
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

      {state === 'finished' && (() => {
        const passed = score !== null && (score / questions.length) * 100 >= 70;
        const percentage = score !== null ? Math.round((score / questions.length) * 100) : 0;

        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
                {passed ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {passed ? 'Assessment Complete!' : 'Assessment Failed'}
              </h2>
              <p className="text-gray-600 mb-6">
                You scored {score} out of {questions.length} questions correctly.
              </p>
              {!passed && (
                <p className="text-red-600 font-semibold mb-4">
                  You need a score of 70% or higher to pass. Please review the material and try again.
                </p>
              )}

              <div className="mb-8">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passed ? 'bg-green-500' : 'bg-red-500'} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>0%</span>
                  <span>{percentage}%</span>
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
              {passed ? (
                <Button
                  onClick={() => onComplete ? onComplete(equipmentId) : router.push(`/dashboard`)}
                  className="w-full"
                >
                  Finish Assessment
                </Button>
              ) : (
                <Button
                  onClick={() => startQuizInternal()}
                  className="w-full"
                >
                  Retry Assessment
                </Button>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  );
}
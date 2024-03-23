import React, { useState, useEffect, useRef, useCallback } from 'react';
import './QuizGame.css';
import quizData from '../db/quizData.json';

const QuizGame = () => {
  const [countdown, setCountdown] = useState(5);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [countDownStatus, setCountDownStatus] = useState('ready');
  const [processingAnswer, setProcessingAnswer] = useState(false); // 상태 추가
  const [disabledInput, setDisabledInput] = useState(true);

  const [answer, setAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [restartVisible, setRestartVisible] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState('');
  const answerInputRef = useRef(null);
  const correctSound = useRef(new Audio('/correct.mp3'));

  useEffect(() => {
    let count;

    if (countdown === 0) {
      clearInterval(count);
    }
    if (countDownStatus === 'pause') {
      clearInterval(count);
    }

    if (countDownStatus === 'continue') {
      count = setInterval(() => {
        setCountdown((prevCount) => prevCount - 1);
        playTicTokSound();
      }, 1000);
    }

    if (countDownStatus === 'finish' || countdown === 0) {
      clearInterval(count);
      setRestartVisible(true);
      setDisabledInput(true);
    }

    return () => clearInterval(count);
  }, [countDownStatus, countdown]);

  useEffect(() => {
    if (!disabledInput) {
      answerInputRef.current.focus();
    }
  }, [disabledInput]);

  const handleStartGame = () => {
    setGameStarted(true);
    setDisabledInput(false);
    setCountDownStatus('continue');
    selectNextQuestion();
  };

  const handleRestartClick = () => {
    for (const q of quizData) {
      q.showed = false;
    }
    setGameStarted(true);
    setDisabledInput(false);
    setCountdown(5);
    setIsCorrect(null);
    setRestartVisible(false);
    setScore(0);
    setProcessingAnswer(false);

    setCountDownStatus('continue');
    selectNextQuestion();
  };

  const playCorrectSound = useCallback(() => {
    correctSound.current.currentTime = 0;
    correctSound.current.play();
  }, []);

  const playIncorrectSound = useCallback(() => {
    const incorrectSound = new Audio('/incorrect.mp3');
    incorrectSound.currentTime = 0;
    incorrectSound.play();
  }, []);

  const playTicTokSound = useCallback(() => {
    const ticTokSound = new Audio('/tictok.mp3');
    ticTokSound.currentTime = 0;
    ticTokSound.play();
  }, []);

  const selectNextQuestion = () => {
    const id = getRandomQuizId();

    const [quiz] = quizData.filter((q) => q.id === id);

    if (quiz) {
      setCurrentQuestion(quiz.question);
    }
  };

  const handleInputChange = (event) => {
    setAnswer(event.target.value);
  };

  const handleEnterKeyPress = (event) => {
    if (event.key === 'Enter') {
      checkAnswer();
    }
  };

  const checkAnswer = () => {
    if (processingAnswer) {
      // 이전 처리가 진행 중인 경우 중복 호출 방지
      return;
    }

    setProcessingAnswer(true); // 처리 중 상태로 변경

    if (currentQuestion) {
      const currentQuiz = quizData.find((item) => item.question === currentQuestion);

      if (currentQuiz.correctAnswer === answer) {
        setCountDownStatus('pause');
        setIsCorrect(true);
        setScore(score + 1);
        playCorrectSound();

        setTimeout(() => {
          setAnswer('');
          if (quizData.filter((data) => !data.showed).length > 0) {
            setCountDownStatus('continue');
            setCountdown(5);
            setIsCorrect(null);
            selectNextQuestion();
          } else {
            setCountDownStatus('finish');
          }
          setProcessingAnswer(false); // 처리 완료 후 상태 변경
        }, 1000);
      } else {
        setAnswer('');
        setIsCorrect(false);
        setAnswerFeedback(`(정답: ${currentQuiz.correctAnswer})`);
        setRestartVisible(true);
        playIncorrectSound();
        setCountDownStatus('finish');
        setProcessingAnswer(false);
      }
    }
  };

  const showText = (countDownStatus) => {
    if (countDownStatus === 'ready') {
      return (
        <div>
          스타트 버튼을 누르면 게임이 시작됩니다. <br />
          (제한시간: 5초)
        </div>
      );
    } else if (countDownStatus === 'continue' || countDownStatus === 'pause') {
      return <div>{currentQuestion}</div>;
    } else if (countDownStatus === 'finish') {
      if (score === quizData.length) {
        return <div>-완- 당신은 사자성어 왕!!'</div>;
      }
    }
    return <div>{currentQuestion}</div>;
  };

  const showResult = (isCorrect, countdown) => {
    if (countdown === 0) {
      return <div>⏰시간 초과! {answerFeedback}</div>;
    }
    if (isCorrect === null || score === quizData.length) {
      return <div>정답 확인</div>;
    }

    if (isCorrect === true) {
      return <div>🟢정답입니다.</div>;
    }

    if (isCorrect === false) {
      return <div>❌오답입니다. {answerFeedback}</div>;
    }
  };

  return (
    <div>
      <div className="header">
        <h1>Quizfy</h1>
      </div>
      <div className="lion-saying-quiz-text">사자성어</div>
      <div className="quiz-game-container">
        <div className="box quiz-box">{showText(countDownStatus)}</div>

        <div className="box-wrapper">
          <input
            ref={answerInputRef}
            type="text"
            className="box answer-input-box"
            value={answer}
            onChange={handleInputChange}
            onKeyDown={handleEnterKeyPress}
            placeholder="정답을 입력하세요."
            disabled={disabledInput}
          />
          <div className="box enter-box" onClick={checkAnswer} disabled={!gameStarted}>
            ENTER
          </div>
          <div className="box score-box">SCORE: {score}점</div>
        </div>
        <div className="box answer-check-box">{showResult(isCorrect, countdown)}</div>
        {!gameStarted && (
          <div className="box start-box" onClick={handleStartGame}>
            START
          </div>
        )}
        {restartVisible && (
          <div className="box restart-box" onClick={handleRestartClick}>
            🔄RESTART
          </div>
        )}
        <div className="box countdown-box">{countdown === 0 ? '0' : countdown}</div>
      </div>
    </div>
  );
};

function getRandomQuizId() {
  const unshowedData = quizData.filter((data) => !data.showed);

  if (unshowedData.length > 0) {
    const randomIndex = Math.floor(Math.random() * unshowedData.length);

    for (const q of quizData) {
      if (q.id === unshowedData[randomIndex].id) {
        q.showed = true;
      }
    }

    return unshowedData[randomIndex].id;
  } else {
    return null;
  }
}

export default QuizGame;

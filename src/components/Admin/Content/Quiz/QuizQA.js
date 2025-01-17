import { useEffect, useState } from 'react';
import './../Quiz/QuizQA.scss'
import Select from 'react-select';
import { FiPlusSquare } from "react-icons/fi";
import { IoIosRemoveCircleOutline } from "react-icons/io";
import { RiImageAddFill } from "react-icons/ri";
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import Lightbox from "yet-another-react-lightbox";
import {
    getAllQuizForAdmin, postCreateNewQuestionForQuiz,
    postCreateNewAnswerForQuestion,
    getQuizWithQA,
    postUpsertQA
} from "../../../../services/apiService";
import { toast } from "react-toastify";

const QuizQA = (props) => {
    const initQuestions = [
        {
            id: uuidv4(),
            description: '',
            imageFile: '',
            imageName: '',
            answers: [
                {
                    id: uuidv4(),
                    description: '',
                    isCorrect: false
                }
            ]
        },
    ];

    const [questions, setQuestions] = useState(initQuestions)
    const [isPreviewImage, setIsPreviewImage] = useState(false);
    const [dataImagePreview, serDataImagePreview] = useState({
        url: ''
    });

    const [selectedQuiz, setSelectedQuiz] = useState({});


    const [listQuiz, setListQuiz] = useState([]);

    useEffect(() => {
        fetchListQuiz();
    }, [])

    useEffect(() => {
        if (selectedQuiz && selectedQuiz.value) {
            fetchQuizWithQA();
        }

    }, [selectedQuiz])

    // return a promise that resolves with a File instance
    function urltoFile(url, filename, mimeType) {
        return (fetch(url)
            .then(function (res) { return res.arrayBuffer(); })
            .then(function (buf) { return new File([buf], filename, { type: mimeType }); })
        );
    }

    //Usage example:

    const fetchQuizWithQA = async () => {
        let res = await getQuizWithQA(selectedQuiz.value);
        console.log(res);
        if (res && res.EC === 0) {
            // convert base64 to FileObj
            let newQA = [];
            for (let i = 0; i < res.DT.qa.length; i++) {
                let q = res.DT.qa[i];
                if (q.imageFile) {
                    q.imageName = `Question-${q.id}.png`;
                    q.imageFile =
                        await urltoFile(`data:image/png;base64,${q.imageFile}`, `Question-${q.id}.png`, 'image/png');
                }
                newQA.push(q);
            }
            setQuestions(newQA);
        }

    }

    const fetchListQuiz = async () => {
        let res = await getAllQuizForAdmin();
        if (res && res.EC === 0) {
            let newQuiz = res.DT.map(item => {
                return {
                    value: item.id,
                    label: `${item.id} - ${item.description}`
                }
            })
            setListQuiz(newQuiz);
        }
    }

    const handleAddRemoveQuestion = (type, id) => {
        if (type === "ADD") {
            const newQuestion = {
                id: uuidv4(),
                description: '',
                imageFile: '',
                imageName: '',
                answers: [
                    {
                        id: uuidv4(),
                        description: '',
                        isCorrect: false
                    }
                ]
            }
            setQuestions([...questions, newQuestion])
        }

        if (type === "REMOVE") {
            let questionsClone = _.cloneDeep(questions);
            questionsClone = questionsClone.filter(item => item.id !== id);
            setQuestions(questionsClone);
        }
    }

    const handleAddRemoveAnswer = (type, id, questionId) => {
        let questionsClone = _.cloneDeep(questions);
        if (type === "ADD") {
            const newAnswer =
            {
                id: uuidv4(),
                description: '',
                isCorrect: false
            };
            let index = questionsClone.findIndex(item => item.id === questionId);
            questionsClone[index].answers.push(newAnswer);
            setQuestions(questionsClone);
        }

        if (type === "REMOVE") {
            let questionsClone = _.cloneDeep(questions);
            let index = questionsClone.findIndex(item => item.id === questionId);
            questionsClone[index].answers = questionsClone[index].answers.filter(item => item.id !== id)
            setQuestions(questionsClone);
        }
    }

    const handleOnChange = (type, questionId, value) => {
        if (type === 'QUESTION') {
            let questionsClone = _.cloneDeep(questions);
            let index = questionsClone.findIndex(item => item.id === questionId);
            if (index > -1) {
                questionsClone[index].description = value;
                setQuestions(questionsClone);
            }
        }
    }

    const handleOnChangeFileQuestion = (questionId, event) => {
        let questionsClone = _.cloneDeep(questions);
        let index = questionsClone.findIndex(item => item.id === questionId);
        if (index > -1 && event.target && event.target.files && event.target.files[0]) {
            questionsClone[index].imageFile = event.target.files[0];
            questionsClone[index].imageName = event.target.files[0].name;
            setQuestions(questionsClone);
        }
    }

    const handleAnswerQuestion = (type, answerId, questionId, value) => {
        let questionsClone = _.cloneDeep(questions);
        let qindex = questionsClone.findIndex(item => item.id === questionId);
        if (qindex > -1) {
            let aindex = questionsClone[qindex].answers.findIndex(item => item.id === answerId);
            if (type === 'CHECKBOX') {
                questionsClone[qindex].answers[aindex].isCorrect = questionsClone[qindex].answers[aindex].isCorrect = value;
            }
            if (type === 'INPUT') {
                questionsClone[qindex].answers[aindex].description = questionsClone[qindex].answers[aindex].description = value;
            }
            setQuestions(questionsClone);
        }
    }

    const handleSubmitQuestionForQuiz = async () => {
        // to do
        if (_.isEmpty(selectedQuiz)) {
            toast.error("Please choose a Quiz");
            return;
        }

        //validate question
        let isValidQ = true;
        let indexQuestionQ = 0;

        for (let i = 0; i < questions.length; i++) {
            if (!questions[i].description) {
                indexQuestionQ = i;
                isValidQ = false;
                break;
            }
        }

        if (!isValidQ) {
            toast.error(`Question-${indexQuestionQ + 1} 's description is blank`);
            return;
        }

        // validate answer 
        let isValid = true;
        let indexQuestion = 0;
        let indexAnswer = 0;

        for (let i = 0; i < questions.length; i++) {
            indexQuestion = i;
            for (let j = 0; j < questions[i].answers.length; j++) {
                if (!questions[i].answers[j].description) {
                    indexAnswer = j;
                    isValid = false;
                    break;
                }
            }
            if (!isValid) {
                break;
            }
        }

        if (!isValid) {
            toast.error(`Answer-${indexAnswer + 1} 's description of Question-${indexQuestion + 1} is blank`);
            return;
        }

        let questionsClone = _.cloneDeep(questions);
        for (let i = 0; i < questionsClone.length; i++) {
            if (questionsClone[i].imageFile) {
                questionsClone[i].imageFile = await toBase64(questionsClone[i].imageFile)
            }
        }
        //submit questions
        let res = await postUpsertQA({
            quizId: selectedQuiz.value,
            questions: questionsClone
        });

        if (res && res.EC === 0) {
            toast.success(res.EM);
            fetchQuizWithQA();
        }

        // setQuestions(initQuestions);
    }

    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });

    const handlePreviewImage = (questionId) => {
        let questionsClone = _.cloneDeep(questions);
        let index = questionsClone.findIndex(item => item.id === questionId);
        if (index > -1) {
            serDataImagePreview({
                url: URL.createObjectURL(questionsClone[index].imageFile)
            });
            setIsPreviewImage(true);
        }
    }

    return (
        <div className="questions-container">
            <div className='add-new-questions'>
                <div className='col-6 form-group'>
                    <label className='mb-1'>Select Quiz:</label>
                    <Select
                        defaultValue={selectedQuiz}
                        onChange={setSelectedQuiz}
                        options={listQuiz}
                    />
                </div>
                <div className='mt-3 mb-1'>
                    Add Questions:
                </div>
                {questions && questions.map((question, index) => {
                    return (
                        <div key={question.id} className='q-main mb-4'>
                            <div className='questions-content'>

                                <div className="form-floating description">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="name@example.com"
                                        value={question.description}
                                        onChange={(event) => handleOnChange('QUESTION', question.id, event.target.value)}
                                    />
                                    <label className='label-question'>Question {index + 1}'s description</label>
                                </div>

                                <div className='group-upload'>
                                    <label className='label-upload' htmlFor={`${question.id}`}><RiImageAddFill className='icon-add-image' /></label>
                                    <input
                                        hidden
                                        type='file'
                                        id={`${question.id}`}
                                        onChange={(event) => handleOnChangeFileQuestion(question.id, event)}
                                    ></input>
                                    <span>
                                        {question.imageFile ?
                                            <span style={{ cursor: "pointer" }}
                                                onClick={() => handlePreviewImage(question.id)}
                                            >
                                                {question.imageName}
                                            </span>
                                            :
                                            'Upload Your Image'
                                        }
                                    </span>


                                </div>
                                <div className='btn-add'>
                                    <span className='icon-add' onClick={() => handleAddRemoveQuestion('ADD', '')}><FiPlusSquare /></span>
                                    {questions.length > 1 &&
                                        <span className='icon-remove' onClick={() => handleAddRemoveQuestion('REMOVE', question.id)}><IoIosRemoveCircleOutline /></span>
                                    }

                                </div>
                            </div>

                            {question.answers && question.answers.length > 0
                                && question.answers.map((answer, index) => {
                                    return (
                                        <div key={answer.id} className='answers-content'>
                                            <input className="form-check-input iscorrect"
                                                type="checkbox"
                                                checked={answer.isCorrect}
                                                onChange={(event) => handleAnswerQuestion('CHECKBOX', answer.id, question.id, event.target.checked)}
                                            />
                                            <div className="form-floating answer-name">
                                                <input
                                                    type="text"
                                                    class="form-control"
                                                    placeholder="name@example.com"
                                                    value={answer.description}
                                                    onChange={(event) => handleAnswerQuestion('INPUT', answer.id, question.id, event.target.value)}
                                                />
                                                <label className='label-answer'>Answer {index + 1} </label>
                                            </div>
                                            <div className='btn-group'>
                                                <span className='icon-add' onClick={() => handleAddRemoveAnswer("ADD", "", question.id)}><FiPlusSquare /></span>
                                                {
                                                    question.answers.length > 1 &&
                                                    <span className='icon-remove'
                                                        onClick={() => handleAddRemoveAnswer("REMOVE", answer.id, question.id)}
                                                    ><IoIosRemoveCircleOutline /></span>
                                                }

                                            </div>
                                        </div>
                                    )
                                })}

                        </div>
                    )
                })
                }

                {
                    questions && questions.length > 0 &&
                    <div>
                        <button
                            onClick={() => handleSubmitQuestionForQuiz()}
                            className='btn btn-warning'>Save Questions</button>
                    </div>
                }

                {isPreviewImage === true &&
                    <Lightbox
                        open={isPreviewImage}
                        close={() => (setIsPreviewImage(false))}
                        slides={[
                            {
                                src: dataImagePreview.url,
                            }
                        ]}
                        render={{
                            buttonPrev: () => null,
                            buttonNext: () => null,
                        }}

                    >
                    </Lightbox>
                }

            </div>
        </div>
    )
}

export default QuizQA;
import { useEffect, useState } from "react";


const TableQuiz = (props) => {

    const { listQuiz, hanldeClickBtnUpdate, hanldeClickBtnDelete } = props

    return (
        <>
            <div className='title'>
                List Quizzes:
            </div>
            <table className="table table-hover table-bordered">
                <thead>
                    <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Name</th>
                        <th scope="col">Description</th>
                        <th scope="col">Type</th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {listQuiz && listQuiz.map((item, index) => {
                        return (
                            <tr key={`table-quiz-${index}`}>
                                <th>{item.id}</th>
                                <td>{item.name}</td>
                                <td>{item.description}</td>
                                <td>{item.difficulty}</td>
                                <td>
                                    <button
                                        className="btn btn-warning mx-3"
                                        onClick={() => hanldeClickBtnUpdate(item)}
                                    >Update</button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => hanldeClickBtnDelete(item)}
                                    >Delete</button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </>
    )
}

export default TableQuiz;
import { useState, useEffect } from "react";
import api, { getStoredUser } from "../api/client";
import toast from "react-hot-toast";
function History() {

  const [history, setHistory] =
  useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [selectedItems, setSelectedItems] =
    useState([]);

  const filteredHistory =
    history.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        )
    );

  const selectAll = () => {

    setSelectedItems(
      filteredHistory.map(
        (item) => item.id
      )
    );
  };

  const deselectAll = () => {

    setSelectedItems([]);
  };

  const clearHistory = async () => {

  if (
    !window.confirm(
      "Delete entire history?"
    )
  ) return;

  try {

    const user = getStoredUser();

    await api.delete(
      `/clear-history/${user.id}`
    );

    setHistory([]);

    setSelectedItems([]);

  } catch {

    toast.error("Failed to clear history.");

  }
};

  useEffect(() => {

  const fetchHistory =
    async () => {

      try {

        const user = getStoredUser();
        const res =
          await api.get(
            `/user-history/${user.id}`
          );

        setHistory(res.data);

      } catch {

        toast.error("Failed to load history.");

      }
    };

  fetchHistory();

}, []);

const deleteSelected = async () => {

  if (selectedItems.length === 0) {

    toast.error("Please select interviews first.");
    return;
  }

  try {

    const selectedInterviews =
      history.filter(
        (item) =>
          selectedItems.includes(item.id)
      );

    for (
      const interview
      of selectedInterviews
    ) {

      await api.delete(
        `/delete-interview/${interview.id}`
      );

    }

    setHistory(
      history.filter(
        item =>
          !selectedInterviews.some(
            selected =>
              selected.id === item.id
          )
      )
    );

    setSelectedItems([]);

  } catch {

    toast.error("Failed to delete selected interviews.");

  }
};
  return (
    <div className="container fade-in">

      <h1>
        Interview History
      </h1>

      <h3>
        Total Interviews:
        {" "}
        {history.length}
      </h3>

      <input
        type="text"
        placeholder="Search by date, score, company, feedback..."
        value={searchTerm}
        onChange={(e) =>
          setSearchTerm(
            e.target.value
          )
        }
        style={{
          width: "100%",
          marginBottom: "20px"
        }}
      />

      <div className="btn-row">

        <button
          className="submit-btn btn-secondary"
          onClick={selectAll}
        >
          Select All
        </button>

        <button
          className="submit-btn btn-secondary"
          onClick={deselectAll}
        >
          Deselect All
        </button>

        <button
          className="submit-btn btn-danger"
          onClick={deleteSelected}
        >
          Delete Selected
        </button>

        <button
          className="submit-btn btn-danger"
          onClick={clearHistory}
        >
          Clear History
        </button>

      </div>

      {
        filteredHistory.length === 0
        ? (
          <p>
            No interviews found.
          </p>
        )
        : (
          filteredHistory.map(
            (item) => (

              <div
  key={item.id}
  className="history-item"
>

  <input
    type="checkbox"
    aria-label="Select interview"
    checked={
      selectedItems.includes(item.id)
    }
    onChange={() => {

      setSelectedItems(
        selectedItems.includes(item.id)
          ? selectedItems.filter(
              (i) => i !== item.id
            )
          : [...selectedItems, item.id]
      );
    }}
  />

  <div className="question-box">

    <div className="history-head">

      <div>
        <h3>
          Interview #
          {history.length - history.indexOf(item)}
        </h3>
        <p className="history-date">
          {item.date}
        </p>
      </div>

      <span
        className={`score-badge ${
          item.score >= 80
            ? "high"
            : item.score >= 60
            ? "mid"
            : "low"
        }`}
      >
        {item.score}/100
      </span>

    </div>

    <details className="feedback-details">
      <summary>View feedback</summary>
      <pre>{item.feedback}</pre>
    </details>

  </div>

</div>

            )
          )
        )
      }

    </div>
  );
}

export default History;
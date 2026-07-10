import { useState, useEffect } from "react";
import api from "../api/client";
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
      history.map(
        (_, index) => index
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

    const user =
      JSON.parse(
        localStorage.getItem(
          "user"
        )
      );

    await api.delete(
      `/clear-history/${user.id}`
    );

    setHistory([]);

    setSelectedItems([]);

  } catch (err) {

    console.log(err);

  }
};

  useEffect(() => {

  const fetchHistory =
    async () => {

      try {

        const user =
          JSON.parse(
            localStorage.getItem(
              "user"
            )
          );
          console.log(
  "Current User:",
  user
);
        const res =
          await api.get(
            `/user-history/${user.id}`
          );
          console.log(
  "DB History:",
  res.data
);

        setHistory(res.data);

      } catch (err) {

        console.log(err);

      }
    };

  fetchHistory();

}, []);

console.log(
  "History state:",
  history
);
const deleteSelected = async () => {

  if (selectedItems.length === 0) {

    toast.error("Please select interviews first.");
    return;
  }

  try {

    const selectedInterviews =
      filteredHistory.filter(
        (_, index) =>
          selectedItems.includes(index)
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

  } catch (err) {

    console.log(err);

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

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "20px"
        }}
      >

        <button
          className="submit-btn"
          onClick={selectAll}
        >
          Select All
        </button>

        <button
          className="submit-btn"
          onClick={deselectAll}
        >
          Deselect All
        </button>

        <button
          className="submit-btn"
          onClick={deleteSelected}
        >
          Delete Selected
        </button>

        <button
          className="submit-btn"
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
            (item, index) => (

              <div
  key={index}
  style={{
    display: "flex",
    alignItems: "flex-start",
    gap: "15px",
    marginBottom: "20px"
  }}
>

  <input
    type="checkbox"
    checked={
      selectedItems.includes(index)
    }
    onChange={() => {

      if (
        selectedItems.includes(index)
      ) {

        setSelectedItems(
          selectedItems.filter(
            (i) => i !== index
          )
        );

      } else {

        setSelectedItems([
          ...selectedItems,
          index
        ]);
      }
    }}
    style={{
      width: "24px",
      height: "24px",
      marginTop: "25px",
      cursor: "pointer"
    }}
  />

  <div
    className="question-box"
    style={{
      flex: 1
    }}
  >

    <h3>
      Interview #
      {history.length - index}
    </h3>

    <p>
      📅 {item.date}
    </p>

    <p>
      🏆 Score:
      {item.score}/100
    </p>

    <pre
      style={{
        whiteSpace:
          "pre-wrap"
      }}
    >
      {item.feedback}
    </pre>

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
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

const globalResearchUpdates = [
  {
    region: "North America",
    flag: "🇺🇸",
    topic: "Generative AI",
    tag: "AI Systems",
    url: "https://scholar.google.com/scholar?q=generative+AI+AI+systems+research+North+America"
  },
  {
    region: "Europe",
    flag: "🇪🇺",
    topic: "Climate Tech",
    tag: "Sustainable Computing",
    url: "https://scholar.google.com/scholar?q=climate+technology+sustainable+computing+research+Europe"
  },
  {
    region: "Japan",
    flag: "🇯🇵",
    topic: "Robotics",
    tag: "Humanoid Research",
    url: "https://scholar.google.com/scholar?q=humanoid+robotics+research+Japan"
  },
  {
    region: "South Korea",
    flag: "🇰🇷",
    topic: "Semiconductors",
    tag: "Next-Gen Chips",
    url: "https://scholar.google.com/scholar?q=semiconductors+next+generation+chips+research+South+Korea"
  },
  {
    region: "India",
    flag: "🇮🇳",
    topic: "Health AI",
    tag: "AI for Healthcare",
    url: "https://scholar.google.com/scholar?q=AI+healthcare+medical+AI+research+India"
  },
  {
    region: "Singapore",
    flag: "🇸🇬",
    topic: "Cybersecurity",
    tag: "Secure AI",
    url: "https://scholar.google.com/scholar?q=AI+cybersecurity+secure+AI+research+Singapore"
  },
  {
    region: "Australia",
    flag: "🇦🇺",
    topic: "Quantum Computing",
    tag: "Quantum Research",
    url: "https://scholar.google.com/scholar?q=quantum+computing+research+Australia"
  },
  {
    region: "Middle East",
    flag: "🌍",
    topic: "Smart Cities",
    tag: "Urban Intelligence",
    url: "https://scholar.google.com/scholar?q=smart+cities+urban+intelligence+research+Middle+East"
  },
  {
    region: "Latin America",
    flag: "🌎",
    topic: "AgriTech",
    tag: "Precision Agriculture",
    url: "https://scholar.google.com/scholar?q=precision+agriculture+AgriTech+research+Latin+America"
  },
  {
    region: "Africa",
    flag: "🌍",
    topic: "Digital Health",
    tag: "Health Innovation",
    url: "https://scholar.google.com/scholar?q=digital+health+health+innovation+research+Africa"
  }
];


function App() {

  // ==========================================================
  // PAGE
  // ==========================================================

  const [activePage, setActivePage] =
    useState("dashboard");


  // ==========================================================
  // PAPERS
  // ==========================================================

  const [uploadedPapers, setUploadedPapers] =
    useState([]);

  const [loadingPapers, setLoadingPapers] =
    useState(false);


  // ==========================================================
  // UPLOAD
  // ==========================================================

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [uploading, setUploading] =
    useState(false);

  const [uploadMessage, setUploadMessage] =
    useState("");


  // ==========================================================
  // CHAT
  // ==========================================================

  const [question, setQuestion] =
    useState("");

  const [chatMessages, setChatMessages] =
    useState([]);

  const [asking, setAsking] =
    useState(false);

  const [selectedPaper, setSelectedPaper] =
    useState(null);


  // ==========================================================
  // PDF VIEWER
  // ==========================================================

  const [viewerSource, setViewerSource] =
    useState(null);


  // ==========================================================
  // FAVORITES
  // ==========================================================

  const [favorites, setFavorites] =
    useState([]);


  // ==========================================================
  // PERSISTENT CHAT HISTORY
  // ==========================================================

  const [savedChats, setSavedChats] =
    useState([]);

  const [currentChatId, setCurrentChatId] =
    useState(null);

  const [loadingChats, setLoadingChats] =
    useState(false);


  // ==========================================================
  // PAPER SUMMARY
  // ==========================================================

  const [paperSummary, setPaperSummary] =
    useState(null);

  const [summarizing, setSummarizing] =
    useState(false);

  const [summaryError, setSummaryError] =
    useState("");


  // ==========================================================
  // PAPER COMPARISON
  // ==========================================================

  const [comparePaper1, setComparePaper1] =
    useState("");

  const [comparePaper2, setComparePaper2] =
    useState("");

  const [paperComparison, setPaperComparison] =
    useState(null);

  const [comparing, setComparing] =
    useState(false);

  const [comparisonError, setComparisonError] =
    useState("");


  // ==========================================================
  // RESEARCH GAP ANALYSIS
  // ==========================================================

  const [gapPaper, setGapPaper] =
    useState("");

  const [researchGaps, setResearchGaps] =
    useState(null);

  const [findingGaps, setFindingGaps] =
    useState(false);

  const [gapError, setGapError] =
    useState("");


  // ==========================================================
  // RESEARCH TOPIC GENERATOR
  // ==========================================================

  const [topicPaper, setTopicPaper] =
    useState("");

  const [researchTopics, setResearchTopics] =
    useState(null);

  const [generatingTopics, setGeneratingTopics] =
    useState(false);

  const [topicError, setTopicError] =
    useState("");


  // ==========================================================
  // RESEARCH PROPOSAL
  // ==========================================================

  const [proposalPaper, setProposalPaper] =
    useState("");

  const [proposalTopic, setProposalTopic] =
    useState("");

  const [researchProposal, setResearchProposal] =
    useState(null);

  const [generatingProposal, setGeneratingProposal] =
    useState(false);

  const [proposalError, setProposalError] =
    useState("");


  // ==========================================================
  // CHAT SCROLL
  // ==========================================================

  const chatEndRef = useRef(null);


  // ==========================================================
  // SAMPLE PAPERS
  // ==========================================================

  const samplePapers = [
    {
      title: "Attention Is All You Need",
      authors: "Vaswani et al.",
      year: "2017",
      category: "Deep Learning",
    },

    {
      title:
        "BERT: Pre-training of Deep Bidirectional Transformers",
      authors: "Devlin et al.",
      year: "2018",
      category: "NLP",
    },

    {
      title:
        "Deep Residual Learning for Image Recognition",
      authors: "He et al.",
      year: "2015",
      category: "Computer Vision",
    },
  ];


  // ==========================================================
  // FETCH PAPERS
  // ==========================================================

  const fetchPapers = async () => {

    setLoadingPapers(true);

    try {

      const response =
        await fetch(
          `${API_URL}/papers`
        );


      const data =
        await response.json();


      if (response.ok) {

        setUploadedPapers(
          data.papers || []
        );

      }

    } catch (error) {

      console.error(
        "Error loading papers:",
        error
      );

    } finally {

      setLoadingPapers(false);

    }
  };


  // ==========================================================
  // FETCH SAVED CHATS
  // ==========================================================

  const fetchChats = async () => {

    setLoadingChats(true);

    try {

      const response =
        await fetch(
          `${API_URL}/chats`
        );

      const data =
        await response.json();

      if (response.ok) {

        setSavedChats(
          data.chats || []
        );

      }

    } catch (error) {

      console.error(
        "Error loading chats:",
        error
      );

    } finally {

      setLoadingChats(false);

    }

  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    fetchPapers();
    fetchChats();

  }, []);


  // ==========================================================
  // AUTO SCROLL
  // ==========================================================

  useEffect(() => {

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [
    chatMessages,
    asking
  ]);


  // ==========================================================
  // FILE SELECT
  // ==========================================================

  const handleFileSelect = (event) => {

    const file =
      event.target.files[0];


    if (!file) {
      return;
    }


    if (
      file.type !== "application/pdf" &&
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {

      setUploadMessage(
        "Please select a PDF file."
      );

      return;
    }


    const maxSize =
      20 * 1024 * 1024;


    if (file.size > maxSize) {

      setUploadMessage(
        "File size must be less than 20 MB."
      );

      return;
    }


    setSelectedFile(file);

    setUploadMessage("");


    uploadFile(file);

  };


  // ==========================================================
  // UPLOAD
  // ==========================================================

  const uploadFile = async (file) => {

    setUploading(true);

    setUploadMessage(
      "Uploading and processing your paper..."
    );


    try {

      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      const response =
        await fetch(
          `${API_URL}/upload`,
          {
            method: "POST",
            body: formData,
          }
        );


      const data =
        await response.json();


      if (response.ok) {

        setUploadMessage(
          `✓ ${data.filename} processed successfully — ${data.pages} pages, ${data.chunks} chunks`
        );


        setSelectedFile(null);


        await fetchPapers();

      } else {

        setUploadMessage(
          data.detail ||
          "Upload failed."
        );

      }

    } catch (error) {

      console.error(
        "Upload error:",
        error
      );


      setUploadMessage(
        "Unable to connect to the backend."
      );

    } finally {

      setUploading(false);

    }

  };


  // ==========================================================
  // ASK AI
  // ==========================================================

  const askAI = async () => {

    if (
      !question.trim() ||
      asking
    ) {
      return;
    }


    const userQuestion =
      question.trim();


    // Add user message

    setChatMessages(
      previous => [
        ...previous,
        {
          role: "user",
          content: userQuestion,
        },
      ]
    );


    setQuestion("");

    setAsking(true);


    try {

      const response =
        await fetch(
          `${API_URL}/ask`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              question:
                userQuestion,

              filename:
                selectedPaper,

              chat_id:
                currentChatId,
            }),
          }
        );


      const data =
        await response.json();


      if (response.ok) {

        setCurrentChatId(
          data.chat_id
        );

        await fetchChats();

        setChatMessages(
          previous => [
            ...previous,
            {
              role: "assistant",

              content:
                data.answer,

              sources:
                data.sources,

              sourceDetails:
                data.source_details ||
                [],
            },
          ]
        );

      } else {

        setChatMessages(
          previous => [
            ...previous,
            {
              role: "assistant",

              content:
                data.detail ||
                "Something went wrong while asking the AI.",

              sources: 0,

              sourceDetails: [],
            },
          ]
        );

      }

    } catch (error) {

      console.error(
        "Ask AI error:",
        error
      );


      setChatMessages(
        previous => [
          ...previous,
          {
            role: "assistant",

            content:
              "Unable to connect to the AI server.",

            sources: 0,

            sourceDetails: [],
          },
        ]
      );

    } finally {

      setAsking(false);

    }

  };


  // ==========================================================
  // ENTER KEY
  // ==========================================================

  const handleQuestionKeyDown = (
    event
  ) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      askAI();

    }

  };


  // ==========================================================
  // NEW CHAT
  // ==========================================================

  const newChat = () => {

    setCurrentChatId(null);

    setChatMessages([]);

    setQuestion("");

    setViewerSource(null);

    setSelectedPaper(null);

    setPaperSummary(null);
    setSummarizing(false);
    setSummaryError("");

    setResearchTopics(null);
    setGeneratingTopics(false);
    setTopicError("");
    setTopicPaper("");

    setResearchProposal(null);
    setGeneratingProposal(false);
    setProposalError("");
    setProposalPaper("");
    setProposalTopic("");

    setActivePage("dashboard");

  };


  // ==========================================================
  // LOAD SAVED CHAT
  // ==========================================================

  const loadChat = async (chatId) => {

    try {

      const response =
        await fetch(
          `${API_URL}/chats/${chatId}`
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.detail ||
          "Could not load chat."
        );

        return;

      }

      setCurrentChatId(
        data.id
      );

      setSelectedPaper(
        data.filename || null
      );

      const messages =
        (data.messages || []).map(
          message => ({
            role:
              message.role === "assistant"
                ? "assistant"
                : "user",

            content:
              message.content,

            sources:
              message.sources || 0,

            sourceDetails:
              message.sourceDetails || [],
          })
        );

      setChatMessages(
        messages
      );

      setQuestion("");

      setViewerSource(null);

      setActivePage("dashboard");

    } catch (error) {

      console.error(
        "Load chat error:",
        error
      );

      alert(
        "Unable to load this chat."
      );

    }

  };


  // ==========================================================
  // DELETE SAVED CHAT
  // ==========================================================

  const deleteSavedChat = async (
    chatId
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this chat?"
      );

    if (!confirmed) {
      return;
    }

    try {

      const response =
        await fetch(
          `${API_URL}/chats/${chatId}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (response.ok) {

        setSavedChats(
          previous =>
            previous.filter(
              chat =>
                chat.id !== chatId
            )
        );

        if (
          currentChatId === chatId
        ) {

          newChat();

        }

      } else {

        alert(
          data.detail ||
          "Could not delete chat."
        );

      }

    } catch (error) {

      console.error(
        "Delete chat error:",
        error
      );

      alert(
        "Unable to connect to backend."
      );

    }

  };


  // ==========================================================
  // SUMMARIZE PAPER
  // ==========================================================

  const summarizePaper = async (filename) => {

    if (!filename) {
      return;
    }

    setSummarizing(true);
    setPaperSummary(null);
    setSummaryError("");
    setViewerSource(null);
    setActivePage("dashboard");

    try {

      const response =
        await fetch(
          `${API_URL}/summarize`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filename,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setSummaryError(
          data.detail ||
          "Could not summarize the paper."
        );

        return;

      }

      setPaperSummary(data);

    } catch (error) {

      console.error(
        "Summarization error:",
        error
      );

      setSummaryError(
        "Unable to connect to the backend."
      );

    } finally {

      setSummarizing(false);

    }

  };


  // ==========================================================
  // COMPARE PAPERS
  // ==========================================================

  const comparePapers = async () => {

    if (!comparePaper1 || !comparePaper2) {

      setComparisonError(
        "Please select two research papers."
      );

      setPaperComparison(null);

      return;
    }

    if (comparePaper1 === comparePaper2) {

      setComparisonError(
        "Please select two different research papers."
      );

      setPaperComparison(null);

      return;
    }

    setComparing(true);
    setPaperComparison(null);
    setComparisonError("");

    try {

      const response =
        await fetch(
          `${API_URL}/compare`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              filename1: comparePaper1,
              filename2: comparePaper2,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setComparisonError(
          data.detail ||
          "Could not compare the papers."
        );

        return;
      }

      setPaperComparison(data);

    } catch (error) {

      console.error(
        "Paper comparison error:",
        error
      );

      setComparisonError(
        "Unable to connect to the backend."
      );

    } finally {

      setComparing(false);

    }

  };


  // ==========================================================
  // CLEAR PAPER COMPARISON
  // ==========================================================

  const clearPaperComparison = () => {

    setPaperComparison(null);
    setComparisonError("");
    setComparePaper1("");
    setComparePaper2("");
  };


  // ==========================================================
  // FIND RESEARCH GAPS
  // ==========================================================

  const findResearchGaps = async () => {

    if (!gapPaper) {

      setGapError("Please select a research paper.");
      setResearchGaps(null);
      return;
    }

    setFindingGaps(true);
    setResearchGaps(null);
    setGapError("");

    try {

      const response =
        await fetch(
          `${API_URL}/research-gaps`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              filename: gapPaper,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setGapError(
          data.detail ||
          "Could not identify research gaps."
        );

        return;
      }

      setResearchGaps(data);

    } catch (error) {

      console.error(
        "Research gap error:",
        error
      );

      setGapError(
        "Unable to connect to the backend."
      );

    } finally {

      setFindingGaps(false);

    }

  };


  // ==========================================================
  // CLEAR RESEARCH GAPS
  // ==========================================================

  const clearResearchGaps = () => {

    setResearchGaps(null);
    setGapError("");
    setGapPaper("");
  };


  // ==========================================================
  // GENERATE RESEARCH TOPICS
  // ==========================================================

  const generateResearchTopics = async () => {

    if (!topicPaper) {

      setTopicError(
        "Please select a research paper."
      );

      setResearchTopics(null);
      return;
    }

    setGeneratingTopics(true);
    setResearchTopics(null);
    setTopicError("");

    try {

      const response =
        await fetch(
          `${API_URL}/research-topics`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              filename: topicPaper,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setTopicError(
          data.detail ||
            "Could not generate research topics."
        );

        return;
      }

      setResearchTopics(data);

    } catch (error) {

      console.error(
        "Research topic generation error:",
        error
      );

      setTopicError(
        "Unable to connect to the backend."
      );

    } finally {

      setGeneratingTopics(false);
    }
  };


  // ==========================================================
  // CLEAR RESEARCH TOPICS
  // ==========================================================

  const clearResearchTopics = () => {

    setResearchTopics(null);
    setTopicError("");
    setTopicPaper("");
  };


  // ==========================================================
  // GENERATE RESEARCH PROPOSAL
  // ==========================================================

  const generateProposal = async () => {

    if (!proposalPaper) {

      setProposalError(
        "Please select a research paper."
      );

      setResearchProposal(null);
      return;
    }

    if (!proposalTopic.trim()) {

      setProposalError(
        "Please enter a research topic."
      );

      setResearchProposal(null);
      return;
    }

    setGeneratingProposal(true);
    setResearchProposal(null);
    setProposalError("");
    setViewerSource(null);

    try {

      const response =
        await fetch(
          `${API_URL}/research-proposal`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              filename: proposalPaper,
              research_topic:
                proposalTopic.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setProposalError(
          data.detail ||
            "Could not generate the research proposal."
        );

        return;
      }

      setResearchProposal(data);

    } catch (error) {

      console.error(
        "Research proposal error:",
        error
      );

      setProposalError(
        "Unable to connect to the backend."
      );

    } finally {

      setGeneratingProposal(false);
    }
  };


  // ==========================================================
  // CLEAR RESEARCH PROPOSAL
  // ==========================================================

  const clearResearchProposal = () => {

    setResearchProposal(null);
    setProposalError("");
    setProposalPaper("");
    setProposalTopic("");
  };


  // ==========================================================
  // DOWNLOAD RESEARCH PROPOSAL
  // ==========================================================

  const downloadResearchProposal = () => {

    if (!researchProposal?.proposal) {
      return;
    }

    const blob = new Blob(
      [researchProposal.proposal],
      {
        type: "text/markdown;charset=utf-8",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;

    const safeTopic =
      researchProposal.research_topic
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();

    link.download =
      `${safeTopic || "research_proposal"}.md`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };


  // ==========================================================
  // SELECT PAPER
  // ==========================================================

  const selectPaperForAI = (
    filename
  ) => {

    setSelectedPaper(filename);

    setPaperSummary(null);
    setSummarizing(false);
    setSummaryError("");

    setResearchTopics(null);
    setGeneratingTopics(false);
    setTopicError("");

    setResearchProposal(null);
    setGeneratingProposal(false);
    setProposalError("");
    setProposalPaper("");
    setProposalTopic("");

    setChatMessages([]);

    setQuestion("");

    setViewerSource(null);

    setActivePage("dashboard");

  };


  // ==========================================================
  // CLEAR PAPER
  // ==========================================================

  const clearSelectedPaper = () => {

    setSelectedPaper(null);

    setPaperSummary(null);
    setSummarizing(false);
    setSummaryError("");

    setResearchTopics(null);
    setGeneratingTopics(false);
    setTopicError("");

    setResearchProposal(null);
    setGeneratingProposal(false);
    setProposalError("");
    setProposalPaper("");
    setProposalTopic("");

    setChatMessages([]);

    setQuestion("");

    setViewerSource(null);

  };


  // ==========================================================
  // OPEN SOURCE
  // ==========================================================

  const openSourcePage = (
    source
  ) => {

    if (
      !source ||
      !source.filename
    ) {
      return;
    }


    setViewerSource(source);

  };


  // ==========================================================
  // CLOSE PDF VIEWER
  // ==========================================================

  const closePdfViewer = () => {

    setViewerSource(null);

  };


  // ==========================================================
  // DELETE PAPER
  // ==========================================================

  const deletePaper = async (
    filename
  ) => {

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${filename}"?`
      );


    if (!confirmed) {
      return;
    }


    try {

      const response =
        await fetch(
          `${API_URL}/papers/${encodeURIComponent(
            filename
          )}`,
          {
            method: "DELETE",
          }
        );


      const data =
        await response.json();


      if (response.ok) {

        await fetchPapers();


        if (
          selectedPaper === filename
        ) {

          clearSelectedPaper();

        }

      } else {

        alert(
          data.detail ||
          "Could not delete paper."
        );

      }

    } catch (error) {

      console.error(
        "Delete error:",
        error
      );


      alert(
        "Unable to connect to backend."
      );

    }

  };


  // ==========================================================
  // FAVORITE
  // ==========================================================

  const toggleFavorite = (
    title
  ) => {

    setFavorites(
      previous => {

        if (
          previous.includes(title)
        ) {

          return previous.filter(
            item => item !== title
          );

        }


        return [
          ...previous,
          title
        ];

      }
    );

  };


  // ==========================================================
  // DASHBOARD
  // ==========================================================

  const renderDashboard = () => {

    return (

      <div className="dashboard-page">


        {/* ==================================================
            WELCOME
        ================================================== */}

        <div className="welcome-section">

          <h1>
            Welcome to ResearchAI 👋
          </h1>

          <p>
            Your intelligent research assistant
            for understanding academic papers.
          </p>

        </div>

        {/* ==================================================
            GLOBAL RESEARCH PULSE
        ================================================== */}

        <section className="global-research-pulse">

          <div className="pulse-globe-panel">

            <div className="pulse-globe">
              <div className="globe-grid"></div>
              <div className="globe-core"></div>

              <span className="globe-node node-1"></span>
              <span className="globe-node node-2"></span>
              <span className="globe-node node-3"></span>
              <span className="globe-node node-4"></span>

              <div className="globe-orbit orbit-one"></div>
              <div className="globe-orbit orbit-two"></div>
            </div>

            <div className="pulse-copy">
              <div className="pulse-eyebrow">
                <span className="pulse-live-dot"></span>
                GLOBAL RESEARCH PULSE
              </div>

              <h2>
                Discover what researchers
                <span> are exploring worldwide.</span>
              </h2>

              <p>
                Research signals across AI, robotics, quantum computing,
                healthcare, climate technology and emerging science.
              </p>
            </div>

            <div className="pulse-stat">
              <strong>10</strong>
              <span>global regions</span>
            </div>

          </div>

          <div className="research-ticker">

            <div className="ticker-label">
              <span>✦</span>
              RESEARCH UPDATES
            </div>

            <div className="ticker-window">

              <div className="ticker-track">

                {[...globalResearchUpdates, ...globalResearchUpdates].map(
                  (item, index) => (

                    <a
                      className="research-update-tag"
                      key={`${item.region}-${index}`}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open research information about ${item.topic} in ${item.region}`}
                      aria-label={`Open research information about ${item.topic} in ${item.region}`}
                    >

                      <span className="update-flag">
                        {item.flag}
                      </span>

                      <span className="update-region">
                        {item.region}
                      </span>

                      <span className="update-divider">
                        /
                      </span>

                      <span className="update-topic">
                        {item.topic}
                      </span>

                      <span className="update-tag">
                        {item.tag}
                      </span>

                      <span className="update-open-icon">
                        ↗
                      </span>

                    </a>

                  )
                )}

              </div>

            </div>

          </div>

        </section>


        {/* ==================================================
            UPLOAD
        ================================================== */}

        <div className="upload-card">

          <div className="upload-icon">
            📄
          </div>


          <div className="upload-content">

            <h2>
              Upload a Research Paper
            </h2>


            <p>
              Upload a PDF and let AI analyze
              the research for you.
            </p>


            <label className="upload-button">

              {uploading
                ? "Processing..."
                : "Choose PDF"}


              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                disabled={uploading}
                hidden
              />

            </label>


            {uploadMessage && (

              <p className="upload-message">

                {uploadMessage}

              </p>

            )}

          </div>

        </div>


        {/* ==================================================
            RESEARCH CHAT
        ================================================== */}

        <div className="ask-section">


          <div className="ask-header">

            <div>

              <h2>
                Research Chat
              </h2>

              <p>
                Ask questions and explore
                your research papers with AI.
              </p>

            </div>


            <button
              className="new-chat-button"
              onClick={newChat}
            >
              + New Chat
            </button>

          </div>


          {/* ==================================================
              SELECTED PAPER
          ================================================== */}

          {selectedPaper && (

            <div className="selected-paper">

              <span>
                📄
              </span>


              <span>
                Searching:
              </span>


              <strong>
                {selectedPaper}
              </strong>


              <button
                onClick={
                  clearSelectedPaper
                }
              >
                Clear
              </button>

            </div>

          )}


          {/* ==================================================
              CHAT CONTAINER
          ================================================== */}

          <div className="chat-container">

            {chatMessages.length === 0 ? (

              <div className="chat-empty">

                <div className="chat-empty-icon">
                  ✨
                </div>


                <h3>
                  Start your research
                </h3>


                <p>
                  Ask a question about your
                  research papers.
                </p>


                <div className="suggestion-list">

                  <button
                    onClick={() =>
                      setQuestion(
                        "What is the main objective of this paper?"
                      )
                    }
                  >
                    What is the main objective?
                  </button>


                  <button
                    onClick={() =>
                      setQuestion(
                        "What methodology was used?"
                      )
                    }
                  >
                    What methodology was used?
                  </button>


                  <button
                    onClick={() =>
                      setQuestion(
                        "What are the key findings?"
                      )
                    }
                  >
                    What are the key findings?
                  </button>

                </div>

              </div>

            ) : (

              <div className="chat-messages">


                {chatMessages.map(
                  (message, index) => (

                    <div
                      key={index}
                      className={
                        message.role === "user"
                          ? "chat-message user-message"
                          : "chat-message ai-message"
                      }
                    >


                      <div className="message-avatar">

                        {message.role === "user"
                          ? "👤"
                          : "🤖"}

                      </div>


                      <div className="message-content">


                        <div className="message-name">

                          {message.role === "user"
                            ? "You"
                            : "ResearchAI"}

                        </div>


                        <div className="message-text">

                          {message.content}

                        </div>


                        {/* ==================================================
                            SOURCES
                        ================================================== */}

                        {message.role ===
                          "assistant" &&
                          message.sources > 0 && (

                            <div className="sources-section">


                              <div className="source-count">

                                📚{" "}
                                {message.sources}{" "}
                                relevant sources used

                              </div>


                              {message.sourceDetails &&
                                message.sourceDetails.length >
                                  0 && (

                                  <div className="source-list">


                                    <div className="sources-title">
                                      Sources
                                    </div>


                                    <div className="source-items">


                                      {message.sourceDetails.map(
                                        (
                                          source,
                                          sourceIndex
                                        ) => (

                                          <button
                                            className="source-item"
                                            key={
                                              sourceIndex
                                            }
                                            onClick={() =>
                                              openSourcePage(
                                                source
                                              )
                                            }
                                            title="Open this page in the PDF"
                                          >

                                            <span className="source-icon">
                                              📄
                                            </span>


                                            <span className="source-filename">
                                              {
                                                source.filename
                                              }
                                            </span>


                                            <span className="source-page">
                                              Page{" "}
                                              {
                                                source.page
                                              }
                                            </span>

                                          </button>

                                        )
                                      )}

                                    </div>

                                  </div>

                                )}

                            </div>

                          )}

                      </div>

                    </div>

                  )
                )}


                {/* TYPING */}

                {asking && (

                  <div className="chat-message ai-message">

                    <div className="message-avatar">
                      🤖
                    </div>


                    <div className="message-content">

                      <div className="message-name">
                        ResearchAI
                      </div>


                      <div className="typing-indicator">

                        <span></span>
                        <span></span>
                        <span></span>

                      </div>

                    </div>

                  </div>

                )}


                <div ref={chatEndRef} />

              </div>

            )}

          </div>


          {/* ==================================================
              CHAT INPUT
          ================================================== */}

          <div className="chat-input-container">

            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
              onKeyDown={
                handleQuestionKeyDown
              }
              placeholder={
                selectedPaper
                  ? `Ask about ${selectedPaper}...`
                  : "Ask anything about your research..."
              }
              rows="2"
              disabled={asking}
            />


            <button
              className="ask-button"
              onClick={askAI}
              disabled={
                asking ||
                !question.trim()
              }
            >

              {asking
                ? "Thinking..."
                : "Send →"}

            </button>

          </div>


          <div className="chat-hint">

            Press <strong>Enter</strong> to send
            · <strong>Shift + Enter</strong> for
            a new line

          </div>

        </div>


        {/* ==================================================
            RESEARCH PAPER SUMMARY
        ================================================== */}

        {(summarizing || summaryError || paperSummary) && (

          <div className="paper-summary-section">

            <div className="paper-summary-header">

              <div>

                <h2>
                  📄 Research Paper Summary
                </h2>

                {paperSummary && (

                  <p>
                    {paperSummary.filename}
                    {" · "}
                    {paperSummary.pages} pages
                    {" · "}
                    {paperSummary.chunks} chunks
                  </p>

                )}

              </div>

              <button
                className="close-summary-button"
                onClick={() => {
                  setPaperSummary(null);
                  setSummaryError("");
                }}
              >
                ✕ Close
              </button>

            </div>


            {summarizing && (

              <div className="summary-loading">

                <div className="summary-loading-icon">
                  🤖
                </div>

                <h3>
                  Analyzing your research paper...
                </h3>

                <p>
                  ResearchAI is reading the paper and
                  preparing a structured summary.
                </p>

                <div className="summary-loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

              </div>

            )}


            {!summarizing && summaryError && (

              <div className="summary-error">
                <strong>Unable to summarize the paper.</strong>
                <p>{summaryError}</p>
              </div>

            )}


            {!summarizing && !summaryError && paperSummary && (

              <div className="paper-summary-content">

                <div className="summary-paper-info">

                  <span>📄 {paperSummary.filename}</span>
                  <span>📑 {paperSummary.pages} pages</span>
                  <span>🧩 {paperSummary.chunks} chunks analyzed</span>

                </div>

                <div className="summary-text">
                  <ReactMarkdown>
                    {paperSummary.summary}
                  </ReactMarkdown>
                </div>

              </div>

            )}

          </div>

        )}


        {/* ==================================================
            PAPER COMPARISON
        ================================================== */}

        <div className="paper-comparison-section">

          <div className="paper-comparison-header">

            <div>

              <h2>
                🔬 Compare Research Papers
              </h2>

              <p>
                Select two uploaded papers and let AI
                compare their research objectives,
                methodology, findings, strengths, and
                limitations.
              </p>

            </div>

          </div>


          <div className="comparison-selectors">

            <div className="comparison-field">

              <label>
                Paper 1
              </label>

              <select
                value={comparePaper1}
                onChange={(event) => {
                  setComparePaper1(
                    event.target.value
                  );
                  setPaperComparison(null);
                  setComparisonError("");
                }}
                disabled={comparing}
              >

                <option value="">
                  Select first paper
                </option>

                {uploadedPapers.map(
                  (paper) => (

                    <option
                      key={paper.filename}
                      value={paper.filename}
                    >
                      {paper.filename}
                    </option>

                  )
                )}

              </select>

            </div>


            <div className="comparison-vs">
              VS
            </div>


            <div className="comparison-field">

              <label>
                Paper 2
              </label>

              <select
                value={comparePaper2}
                onChange={(event) => {
                  setComparePaper2(
                    event.target.value
                  );
                  setPaperComparison(null);
                  setComparisonError("");
                }}
                disabled={comparing}
              >

                <option value="">
                  Select second paper
                </option>

                {uploadedPapers.map(
                  (paper) => (

                    <option
                      key={paper.filename}
                      value={paper.filename}
                    >
                      {paper.filename}
                    </option>

                  )
                )}

              </select>

            </div>


            <button
              className="compare-button"
              onClick={comparePapers}
              disabled={
                comparing ||
                uploadedPapers.length < 2
              }
            >

              {comparing
                ? "Comparing..."
                : "Compare Papers"}

            </button>

          </div>


          {uploadedPapers.length < 2 && (

            <div className="comparison-info">
              Upload at least two research papers
              to use paper comparison.
            </div>

          )}


          {comparisonError && (

            <div className="comparison-error">

              <strong>
                Unable to compare papers.
              </strong>

              <p>
                {comparisonError}
              </p>

            </div>

          )}


          {comparing && (

            <div className="comparison-loading">

              <div className="comparison-loading-icon">
                🔬
              </div>

              <h3>
                Comparing your research papers...
              </h3>

              <p>
                ResearchAI is analyzing both papers
                and identifying similarities and
                differences.
              </p>

              <div className="comparison-loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>

            </div>

          )}


          {!comparing &&
            !comparisonError &&
            paperComparison && (

              <div className="comparison-result">

                <div className="comparison-result-header">

                  <div>

                    <h3>
                      📊 Research Paper Comparison
                    </h3>

                    <p>
                      {paperComparison.paper1}
                      {"  ↔  "}
                      {paperComparison.paper2}
                    </p>

                  </div>

                  <button
                    className="close-comparison-button"
                    onClick={
                      clearPaperComparison
                    }
                  >
                    ✕ Clear
                  </button>

                </div>


                <div className="comparison-result-text">
  <ReactMarkdown>
    {paperComparison.comparison}
  </ReactMarkdown>
</div>

              </div>

            )}

        </div>


        {/* ==================================================
            PDF VIEWER
        ================================================== */}

        {viewerSource && (

          <div className="pdf-viewer-section">


            <div className="pdf-viewer-header">

              <div>

                <h2>
                  PDF Viewer
                </h2>


                <p>

                  {viewerSource.filename}

                  {" · "}

                  Page {viewerSource.page}

                </p>

              </div>


              <button
                className="close-viewer-button"
                onClick={
                  closePdfViewer
                }
              >
                ✕ Close
              </button>

            </div>


            <div className="pdf-viewer-container">

              <iframe
                title="Research Paper PDF Viewer"
                src={`${API_URL}/papers/${encodeURIComponent(
                  viewerSource.filename
                )}#page=${viewerSource.page}`}
                className="pdf-viewer"
              />

            </div>

          </div>

        )}


        {/* ==================================================
            FEATURES
        ================================================== */}

        <div className="features-section">

          <h2>
            What ResearchAI Can Do
          </h2>


          <div className="features-grid">


            <div className="feature-card">

              <div className="feature-icon">
                📖
              </div>


              <h3>
                Understand Papers
              </h3>


              <p>
                Ask questions about complex
                research papers using AI.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                🔎
              </div>


              <h3>
                Semantic Search
              </h3>


              <p>
                Find relevant information
                from your research.
              </p>

            </div>


            <div className="feature-card">

              <div className="feature-icon">
                ⚡
              </div>


              <h3>
                AI-Powered Answers
              </h3>


              <p>
                Get intelligent answers
                from your uploaded papers.
              </p>

            </div>

          </div>

        </div>


        {/* ==================================================
            SAMPLE PAPERS
        ================================================== */}

        <div className="sample-section">

          <div className="section-header">

            <div>

              <h2>
                Popular Research Papers
              </h2>


              <p>
                Explore some well-known papers
              </p>

            </div>

          </div>


          <div className="paper-grid">

            {samplePapers.map(
              (paper, index) => (

                <div
                  className="paper-card"
                  key={index}
                >

                  <div className="paper-card-top">

                    <div className="paper-icon">
                      📄
                    </div>


                    <button
                      className="favorite-button"
                      onClick={() =>
                        toggleFavorite(
                          paper.title
                        )
                      }
                    >

                      {favorites.includes(
                        paper.title
                      )
                        ? "★"
                        : "☆"}

                    </button>

                  </div>


                  <h3>
                    {paper.title}
                  </h3>


                  <p>
                    {paper.authors}
                  </p>


                  <div className="paper-meta">

                    <span>
                      {paper.year}
                    </span>


                    <span>
                      {paper.category}
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      </div>

    );

  };


  // ==========================================================
  // MY PAPERS
  // ==========================================================

  const renderMyPapers = () => {

    return (

      <div className="my-papers-page">


        <div className="page-title">

          <div>

            <h1>
              My Papers
            </h1>


            <p>
              Manage your uploaded research papers.
            </p>

          </div>


          <button
            className="upload-top-button"
            onClick={() =>
              setActivePage(
                "dashboard"
              )
            }
          >
            + Upload Paper
          </button>

        </div>


        {loadingPapers ? (

          <div className="empty-state">

            <div className="empty-icon">
              ⏳
            </div>


            <h2>
              Loading papers...
            </h2>

          </div>

        ) : uploadedPapers.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              📚
            </div>


            <h2>
              No papers uploaded yet
            </h2>


            <p>
              Upload your first research paper
              to get started.
            </p>


            <button
              className="primary-button"
              onClick={() =>
                setActivePage(
                  "dashboard"
                )
              }
            >
              Upload Your First Paper
            </button>

          </div>

        ) : (

          <div className="uploaded-papers-grid">

            {uploadedPapers.map(
              paper => (

                <div
                  className="uploaded-paper-card"
                  key={paper.filename}
                >

                  <div className="uploaded-paper-top">

                    <div className="large-paper-icon">
                      📄
                    </div>

                  </div>


                  <div className="paper-details">

                    <h3>
                      {paper.filename}
                    </h3>


                    <p>
                      PDF Research Paper
                    </p>

                  </div>


                  <div className="paper-actions">


                    <a
                      href={`${API_URL}/papers/${encodeURIComponent(
                        paper.filename
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-button"
                    >
                      Open PDF
                    </a>


                    <button
                      className="primary-button"
                      onClick={() =>
                        selectPaperForAI(
                          paper.filename
                        )
                      }
                    >
                      Ask AI
                    </button>


                    <button
                      className="summary-button"
                      onClick={() =>
                        summarizePaper(
                          paper.filename
                        )
                      }
                      disabled={summarizing}
                    >
                      {summarizing
                        ? "Summarizing..."
                        : "Summarize"}
                    </button>


                    <button
                      className="gap-button paper-gap-button"
                      onClick={() => {
                        setGapPaper(paper.filename);
                        setResearchGaps(null);
                        setGapError("");
                        setActivePage("gaps");
                      }}
                      disabled={findingGaps}
                    >
                      Find Gaps
                    </button>


                    <button
                      className="topic-button paper-topic-button"
                      onClick={() => {
                        setTopicPaper(paper.filename);
                        setResearchTopics(null);
                        setTopicError("");
                        setActivePage("topics");
                      }}
                      disabled={generatingTopics}
                    >
                      Research Topics
                    </button>


                    <button
                      className="proposal-button paper-proposal-button"
                      onClick={() => {
                        setProposalPaper(paper.filename);
                        setProposalTopic("");
                        setResearchProposal(null);
                        setProposalError("");
                        setActivePage("proposal");
                      }}
                      disabled={generatingProposal}
                    >
                      📝 Proposal
                    </button>


                    <button
                      className="delete-button"
                      onClick={() =>
                        deletePaper(
                          paper.filename
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    );

  };


  // ==========================================================
  // PAPER COMPARISON PAGE
  // ==========================================================

  const renderComparison = () => {

    return (

      <div className="my-papers-page">

        <div className="page-title">

          <div>

            <h1>
              Compare Research Papers
            </h1>

            <p>
              Analyze two research papers side by side
              using AI.
            </p>

          </div>

        </div>


        <div className="paper-comparison-page-card">

          <div className="paper-comparison-header">

            <div>

              <h2>
                🔬 AI Paper Comparison
              </h2>

              <p>
                Select two different uploaded papers
                to compare their research.
              </p>

            </div>

          </div>


          {uploadedPapers.length < 2 ? (

            <div className="comparison-info large">
              <div className="comparison-info-icon">
                📚
              </div>

              <h3>
                You need at least two papers
              </h3>

              <p>
                Upload two research papers before
                starting a comparison.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setActivePage("dashboard")
                }
              >
                Upload Papers
              </button>

            </div>

          ) : (

            <>

              <div className="comparison-selectors page-selectors">

                <div className="comparison-field">

                  <label>
                    Paper 1
                  </label>

                  <select
                    value={comparePaper1}
                    onChange={(event) => {
                      setComparePaper1(
                        event.target.value
                      );
                      setPaperComparison(null);
                      setComparisonError("");
                    }}
                    disabled={comparing}
                  >

                    <option value="">
                      Select first paper
                    </option>

                    {uploadedPapers.map(
                      (paper) => (

                        <option
                          key={paper.filename}
                          value={paper.filename}
                        >
                          {paper.filename}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="comparison-vs">
                  VS
                </div>


                <div className="comparison-field">

                  <label>
                    Paper 2
                  </label>

                  <select
                    value={comparePaper2}
                    onChange={(event) => {
                      setComparePaper2(
                        event.target.value
                      );
                      setPaperComparison(null);
                      setComparisonError("");
                    }}
                    disabled={comparing}
                  >

                    <option value="">
                      Select second paper
                    </option>

                    {uploadedPapers.map(
                      (paper) => (

                        <option
                          key={paper.filename}
                          value={paper.filename}
                        >
                          {paper.filename}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <button
                  className="compare-button"
                  onClick={comparePapers}
                  disabled={comparing}
                >
                  {comparing
                    ? "Comparing..."
                    : "Compare Papers"}
                </button>

              </div>


              {comparisonError && (

                <div className="comparison-error">

                  <strong>
                    Unable to compare papers.
                  </strong>

                  <p>
                    {comparisonError}
                  </p>

                </div>

              )}


              {comparing && (

                <div className="comparison-loading">

                  <div className="comparison-loading-icon">
                    🔬
                  </div>

                  <h3>
                    Comparing your research papers...
                  </h3>

                  <p>
                    ResearchAI is analyzing both papers
                    and identifying similarities and
                    differences.
                  </p>

                  <div className="comparison-loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                </div>

              )}


              {!comparing &&
                !comparisonError &&
                paperComparison && (

                  <div className="comparison-result">

                    <div className="comparison-result-header">

                      <div>

                        <h3>
                          📊 Research Paper Comparison
                        </h3>

                        <p>
                          {paperComparison.paper1}
                          {"  ↔  "}
                          {paperComparison.paper2}
                        </p>

                      </div>

                      <button
                        className="close-comparison-button"
                        onClick={
                          clearPaperComparison
                        }
                      >
                        ✕ Clear
                      </button>

                    </div>

                    <div className="comparison-result-text">
                      <ReactMarkdown>
                        {paperComparison.comparison}
                      </ReactMarkdown>
                    </div>

                  </div>

                )}

            </>

          )}

        </div>

      </div>

    );

  };


  // ==========================================================
  // RESEARCH GAP PAGE
  // ==========================================================

  const renderResearchGaps = () => {

    return (

      <div className="my-papers-page">

        <div className="page-title">

          <div>

            <h1>
              Research Gap Finder
            </h1>

            <p>
              Identify limitations, unexplored areas, and potential future research directions using AI.
            </p>

          </div>

        </div>

        <div className="research-gap-page-card">

          <div className="research-gap-header">

            <div>

              <h2>
                💡 AI Research Gap Analysis
              </h2>

              <p>
                Select one uploaded research paper and let ResearchAI analyze its limitations and opportunities for future work.
              </p>

            </div>

          </div>

          {uploadedPapers.length === 0 ? (

            <div className="gap-info large">

              <div className="gap-info-icon">📚</div>

              <h3>
                No research papers available
              </h3>

              <p>
                Upload a research paper before using the Research Gap Finder.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setActivePage("dashboard")
                }
              >
                Upload Paper
              </button>

            </div>

          ) : (

            <>

              <div className="gap-selector">

                <div className="comparison-field">

                  <label>
                    Research Paper
                  </label>

                  <select
                    value={gapPaper}
                    onChange={(event) => {
                      setGapPaper(event.target.value);
                      setResearchGaps(null);
                      setGapError("");
                    }}
                    disabled={findingGaps}
                  >

                    <option value="">
                      Select a research paper
                    </option>

                    {uploadedPapers.map(
                      (paper) => (
                        <option
                          key={paper.filename}
                          value={paper.filename}
                        >
                          {paper.filename}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <button
                  className="gap-button"
                  onClick={findResearchGaps}
                  disabled={
                    findingGaps ||
                    !gapPaper
                  }
                >
                  {findingGaps
                    ? "Analyzing..."
                    : "Find Research Gaps"}
                </button>

              </div>

              {gapError && (

                <div className="comparison-error">
                  <strong>
                    Unable to analyze research gaps.
                  </strong>
                  <p>{gapError}</p>
                </div>

              )}

              {findingGaps && (

                <div className="gap-loading">

                  <div className="gap-loading-icon">💡</div>

                  <h3>
                    Finding research gaps...
                  </h3>

                  <p>
                    ResearchAI is analyzing the paper's limitations, unexplored areas, and future research opportunities.
                  </p>

                  <div className="gap-loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                </div>

              )}

              {!findingGaps &&
                !gapError &&
                researchGaps && (

                  <div className="gap-result">

                    <div className="gap-result-header">

                      <div>
                        <h3>
                          💡 Research Gap Analysis
                        </h3>
                        <p>
                          {researchGaps.filename}
                        </p>
                      </div>

                      <button
                        className="close-comparison-button"
                        onClick={clearResearchGaps}
                      >
                        ✕ Clear
                      </button>

                    </div>

                    <div className="gap-result-text">
                      <ReactMarkdown>
                        {researchGaps.gaps}
                      </ReactMarkdown>
                    </div>

                  </div>

                )}

            </>

          )}

        </div>

      </div>

    );

  };


  // ==========================================================
  // RESEARCH TOPIC GENERATOR PAGE
  // ==========================================================

  const renderResearchTopics = () => {

    return (

      <div className="my-papers-page">

        <div className="page-title">

          <div>

            <h1>
              Research Topic Generator
            </h1>

            <p>
              Generate practical research topics from the limitations, gaps, and future directions of an uploaded paper.
            </p>

          </div>

        </div>


        <div className="research-topic-page-card">

          <div className="research-topic-header">

            <div>

              <h2>
                🚀 AI Research Topic Generator
              </h2>

              <p>
                Select one uploaded paper and let ResearchAI suggest promising research directions.
              </p>

            </div>

          </div>


          {uploadedPapers.length === 0 ? (

            <div className="topic-info large">

              <div className="topic-info-icon">📚</div>

              <h3>
                No research papers available
              </h3>

              <p>
                Upload a research paper before generating research topics.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setActivePage("dashboard")
                }
              >
                Upload Paper
              </button>

            </div>

          ) : (

            <>

              <div className="topic-selector">

                <div className="comparison-field">

                  <label>
                    Research Paper
                  </label>

                  <select
                    value={topicPaper}
                    onChange={(event) => {
                      setTopicPaper(event.target.value);
                      setResearchTopics(null);
                      setTopicError("");
                    }}
                    disabled={generatingTopics}
                  >

                    <option value="">
                      Select a research paper
                    </option>

                    {uploadedPapers.map(
                      (paper) => (
                        <option
                          key={paper.filename}
                          value={paper.filename}
                        >
                          {paper.filename}
                        </option>
                      )
                    )}

                  </select>

                </div>


                <button
                  className="topic-button"
                  onClick={generateResearchTopics}
                  disabled={
                    generatingTopics ||
                    !topicPaper
                  }
                >
                  {generatingTopics
                    ? "Generating..."
                    : "Generate Topics"}
                </button>

              </div>


              {topicError && (

                <div className="comparison-error">
                  <strong>
                    Unable to generate research topics.
                  </strong>
                  <p>{topicError}</p>
                </div>

              )}


              {generatingTopics && (

                <div className="topic-loading">

                  <div className="topic-loading-icon">🚀</div>

                  <h3>
                    Generating research topics...
                  </h3>

                  <p>
                    ResearchAI is studying the paper's limitations, unanswered questions, and future research opportunities.
                  </p>

                  <div className="topic-loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                </div>

              )}


              {!generatingTopics &&
                !topicError &&
                researchTopics && (

                  <div className="topic-result">

                    <div className="topic-result-header">

                      <div>
                        <h3>
                          🚀 Suggested Research Topics
                        </h3>
                        <p>
                          {researchTopics.filename}
                        </p>
                      </div>

                      <button
                        className="close-comparison-button"
                        onClick={clearResearchTopics}
                      >
                        ✕ Clear
                      </button>

                    </div>

                    <div className="topic-result-text">
                      <ReactMarkdown>
                        {researchTopics.topics}
                      </ReactMarkdown>
                    </div>

                  </div>

              )}

            </>

          )}

        </div>

      </div>

    );
  };


  // ==========================================================
  // RESEARCH PROPOSAL PAGE
  // ==========================================================

  const renderResearchProposal = () => {

    return (

      <div className="my-papers-page">

        <div className="page-title">

          <div>

            <h1>
              Research Proposal Generator
            </h1>

            <p>
              Turn a research topic into a structured academic research proposal using AI.
            </p>

          </div>

        </div>


        <div className="research-proposal-page-card">

          <div className="research-proposal-header">

            <div>

              <h2>
                📝 AI Research Proposal Generator
              </h2>

              <p>
                Select a research paper and provide a research topic. ResearchAI will generate a complete academic proposal using the paper as context.
              </p>

            </div>

          </div>


          {uploadedPapers.length === 0 ? (

            <div className="proposal-info large">

              <div className="proposal-info-icon">
                📚
              </div>

              <h3>
                No research papers available
              </h3>

              <p>
                Upload a research paper before generating a research proposal.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setActivePage("dashboard")
                }
              >
                Upload Paper
              </button>

            </div>

          ) : (

            <>

              <div className="proposal-form">

                <div className="comparison-field">

                  <label>
                    Research Paper
                  </label>

                  <select
                    value={proposalPaper}
                    onChange={(event) => {
                      setProposalPaper(event.target.value);
                      setResearchProposal(null);
                      setProposalError("");
                    }}
                    disabled={generatingProposal}
                  >

                    <option value="">
                      Select a research paper
                    </option>

                    {uploadedPapers.map(
                      (paper) => (
                        <option
                          key={paper.filename}
                          value={paper.filename}
                        >
                          {paper.filename}
                        </option>
                      )
                    )}

                  </select>

                </div>


                <div className="proposal-topic-field">

                  <label>
                    Research Topic
                  </label>

                  <textarea
                    value={proposalTopic}
                    onChange={(event) => {
                      setProposalTopic(event.target.value);
                      setResearchProposal(null);
                      setProposalError("");
                    }}
                    placeholder="Enter your research topic..."
                    rows="4"
                    disabled={generatingProposal}
                  />

                </div>


                <button
                  className="proposal-button"
                  onClick={generateProposal}
                  disabled={
                    generatingProposal ||
                    !proposalPaper ||
                    !proposalTopic.trim()
                  }
                >
                  {generatingProposal
                    ? "Generating Proposal..."
                    : "Generate Research Proposal"}
                </button>

              </div>


              {proposalError && (

                <div className="comparison-error">

                  <strong>
                    Unable to generate proposal.
                  </strong>

                  <p>
                    {proposalError}
                  </p>

                </div>

              )}


              {generatingProposal && (

                <div className="proposal-loading">

                  <div className="proposal-loading-icon">
                    📝
                  </div>

                  <h3>
                    Generating your research proposal...
                  </h3>

                  <p>
                    ResearchAI is analyzing the selected paper and building your academic proposal.
                  </p>

                  <div className="proposal-loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>

                </div>

              )}


              {!generatingProposal &&
                !proposalError &&
                researchProposal && (

                <div className="proposal-result">

                  <div className="proposal-result-header">

                    <div>

                      <h3>
                        📄 Research Proposal
                      </h3>

                      <p>
                        {researchProposal.filename}
                      </p>

                      <p>
                        Topic: {researchProposal.research_topic}
                      </p>

                    </div>

                    <div className="proposal-result-actions">

                      <button
                        className="download-proposal-button"
                        onClick={downloadResearchProposal}
                      >
                        ⬇ Download Proposal
                      </button>

                      <button
                        className="close-comparison-button"
                        onClick={clearResearchProposal}
                      >
                        ✕ Clear
                      </button>

                    </div>

                  </div>


                  <div className="proposal-result-text">
                    <ReactMarkdown>
                      {researchProposal.proposal}
                    </ReactMarkdown>
                  </div>

                </div>

              )}

            </>

          )}

        </div>

      </div>

    );
  };


  // ==========================================================
  // FAVORITES
  // ==========================================================

  const renderFavorites = () => {

    const favoritePapers =
      samplePapers.filter(
        paper =>
          favorites.includes(
            paper.title
          )
      );


    return (

      <div className="my-papers-page">


        <div className="page-title">

          <div>

            <h1>
              Favorites
            </h1>


            <p>
              Your saved research papers.
            </p>

          </div>

        </div>


        {favoritePapers.length === 0 ? (

          <div className="empty-state">

            <div className="empty-icon">
              ☆
            </div>


            <h2>
              No favorites yet
            </h2>


            <p>
              Add papers to your favorites
              from the Dashboard.
            </p>

          </div>

        ) : (

          <div className="paper-grid">

            {favoritePapers.map(
              (paper, index) => (

                <div
                  className="paper-card"
                  key={index}
                >

                  <div className="paper-card-top">

                    <div className="paper-icon">
                      📄
                    </div>


                    <button
                      className="favorite-button"
                      onClick={() =>
                        toggleFavorite(
                          paper.title
                        )
                      }
                    >
                      ★
                    </button>

                  </div>


                  <h3>
                    {paper.title}
                  </h3>


                  <p>
                    {paper.authors}
                  </p>


                  <div className="paper-meta">

                    <span>
                      {paper.year}
                    </span>


                    <span>
                      {paper.category}
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    );

  };


  // ==========================================================
  // SETTINGS
  // ==========================================================

  const renderSettings = () => {

    return (

      <div className="my-papers-page">


        <div className="page-title">

          <div>

            <h1>
              Settings
            </h1>


            <p>
              ResearchAI application settings.
            </p>

          </div>

        </div>


        <div className="settings-card">

          <h2>
            AI Research Assistant
          </h2>


          <p>
            Your research papers are processed
            and stored in the ResearchAI system.
          </p>

        </div>

      </div>

    );

  };


  // ==========================================================
  // PAGE ROUTER
  // ==========================================================

  const renderPage = () => {

    if (
      activePage === "dashboard"
    ) {
      return renderDashboard();
    }


    if (
      activePage === "papers"
    ) {
      return renderMyPapers();
    }


    if (
      activePage === "comparison"
    ) {
      return renderComparison();
    }


    if (
      activePage === "gaps"
    ) {
      return renderResearchGaps();
    }


    if (
      activePage === "topics"
    ) {
      return renderResearchTopics();
    }


    if (
      activePage === "proposal"
    ) {
      return renderResearchProposal();
    }


    if (
      activePage === "favorites"
    ) {
      return renderFavorites();
    }


    if (
      activePage === "settings"
    ) {
      return renderSettings();
    }


    return renderDashboard();

  };


  // ==========================================================
  // APP
  // ==========================================================

  return (

    <div className="app-container">


      {/* ====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">


        <div className="logo">

          <div className="logo-icon">
            ✦
          </div>


          <span>
            ResearchAI
          </span>

        </div>


        <nav className="sidebar-nav">


          <button
            className={
              activePage === "dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage(
                "dashboard"
              )
            }
          >

            <span>
              🏠
            </span>

            Dashboard

          </button>


          <button
            className={
              activePage === "papers"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage(
                "papers"
              )
            }
          >

            <span>
              📚
            </span>

            My Papers


            <span className="nav-count">
              {uploadedPapers.length}
            </span>

          </button>


          <button
            className={
              activePage === "comparison"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage(
                "comparison"
              )
            }
          >

            <span>
              🔬
            </span>

            Compare Papers

          </button>


          <button
            className={
              activePage === "gaps"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage(
                "gaps"
              )
            }
          >

            <span>
              💡
            </span>

            Research Gaps

          </button>


          <button
            className={
              activePage === "topics"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage(
                "topics"
              )
            }
          >

            <span>
              🚀
            </span>

            Research Topics

          </button>


          <button
            className={
              activePage === "proposal"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage(
                "proposal"
              )
            }
          >

            <span>
              📝
            </span>

            Research Proposal

          </button>


          <button
            className={
              activePage === "favorites"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage(
                "favorites"
              )
            }
          >

            <span>
              ⭐
            </span>

            Favorites

          </button>

        </nav>


        {/* ====================================================
            RECENT CHATS
        ===================================================== */}

        <div className="chat-history-sidebar">

          <div className="chat-history-title">

            <span>
              Recent Chats
            </span>

            <button
              className="chat-history-new"
              onClick={newChat}
              title="New Chat"
            >
              +
            </button>

          </div>


          <div className="chat-history-list">

            {loadingChats ? (

              <div className="chat-history-loading">
                Loading chats...
              </div>

            ) : savedChats.length === 0 ? (

              <div className="chat-history-empty">
                No conversations yet.
              </div>

            ) : (

              savedChats
                .slice(0, 10)
                .map(chat => (

                  <div
                    className={
                      currentChatId === chat.id
                        ? "history-item active"
                        : "history-item"
                    }
                    key={chat.id}
                  >

                    <button
                      className="history-open"
                      onClick={() =>
                        loadChat(chat.id)
                      }
                    >

                      <span className="history-icon">
                        💬
                      </span>

                      <span className="history-title">
                        {chat.title}
                      </span>

                    </button>


                    <button
                      className="history-delete"
                      onClick={() =>
                        deleteSavedChat(chat.id)
                      }
                      title="Delete chat"
                    >
                      🗑️
                    </button>

                  </div>

                ))

            )}

          </div>

        </div>


        <div className="sidebar-bottom">


          <button
            className={
              activePage === "settings"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage(
                "settings"
              )
            }
          >

            <span>
              ⚙️
            </span>

            Settings

          </button>


          <div className="storage-box">

            <div className="storage-icon">
              ☁️
            </div>


            <div>

              <strong>

                {uploadedPapers.length}{" "}

                {uploadedPapers.length === 1
                  ? "paper"
                  : "papers"}

              </strong>


              <span>
                stored in ResearchAI
              </span>

            </div>

          </div>

        </div>

      </aside>


      {/* ====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-content">


        <header className="topbar">

          <div className="topbar-title">

            {activePage === "dashboard" &&
              "Dashboard"}

            {activePage === "papers" &&
              "My Papers"}

            {activePage === "favorites" &&
              "Favorites"}

            {activePage === "comparison" &&
              "Compare Papers"}

            {activePage === "gaps" &&
              "Research Gaps"}

            {activePage === "topics" &&
              "Research Topics"}

            {activePage === "proposal" &&
              "Research Proposal"}

            {activePage === "settings" &&
              "Settings"}

          </div>


          <div className="topbar-right">

            <div className="status-indicator">

              <span className="status-dot">
              </span>

              AI Online

            </div>

          </div>

        </header>


        <div className="content-area">

          {renderPage()}

        </div>

      </main>

    </div>

  );

}

export default App;
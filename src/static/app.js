document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showEmptyParticipantMessage(participantList) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "participant-empty";
    emptyMessage.textContent = "No participants yet";
    participantList.appendChild(emptyMessage);
  }

  function createParticipantRow(
    activity,
    email,
    participantList,
    participantCount
  ) {
    const participant = document.createElement("li");
    participant.className = "participant-row";
    participant.dataset.email = email;

    const participantEmail = document.createElement("span");
    participantEmail.textContent = email;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "participant-delete";
    deleteButton.setAttribute(
      "aria-label",
      `Unregister ${email} from ${activity}`
    );
    deleteButton.title = "Unregister participant";

    const deleteIcon = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    deleteIcon.setAttribute("viewBox", "0 0 24 24");
    deleteIcon.setAttribute("aria-hidden", "true");
    deleteIcon.classList.add("delete-icon");

    const deleteIconPath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    deleteIconPath.setAttribute(
      "d",
      "M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"
    );
    deleteIconPath.setAttribute("fill", "none");
    deleteIconPath.setAttribute("stroke", "currentColor");
    deleteIconPath.setAttribute("stroke-linecap", "round");
    deleteIconPath.setAttribute("stroke-linejoin", "round");
    deleteIconPath.setAttribute("stroke-width", "1.8");
    deleteIcon.appendChild(deleteIconPath);
    deleteButton.appendChild(deleteIcon);

    deleteButton.addEventListener("click", async () => {
      deleteButton.disabled = true;

      try {
        const response = await fetch(
          `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
          { method: "DELETE" }
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.detail || "Could not unregister participant");
        }

        participantList.querySelectorAll(".participant-row").forEach((row) => {
          if (row.dataset.email === email) {
            row.remove();
          }
        });

        const remainingParticipants =
          participantList.querySelectorAll(".participant-row").length;
        participantCount.textContent = remainingParticipants;

        if (remainingParticipants === 0) {
          showEmptyParticipantMessage(participantList);
        }

        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
      } catch (error) {
        messageDiv.textContent =
          error instanceof Error
            ? error.message
            : "Failed to unregister participant. Please try again.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
        deleteButton.disabled = false;
        console.error("Error unregistering participant:", error);
      }

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    });

    participant.append(participantEmail, deleteButton);
    return participant;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect
        .querySelectorAll("option:not(:first-child)")
        .forEach((option) => option.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        activityCard.dataset.activityName = name;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.className = "participants-heading";
        participantsHeading.textContent = "Participants ";

        const participantCount = document.createElement("span");
        participantCount.className = "participant-count";
        participantCount.textContent = details.participants.length;
        participantsHeading.appendChild(participantCount);

        const participantList = document.createElement("ul");
        participantList.className = "participant-list";

        if (details.participants.length === 0) {
          showEmptyParticipantMessage(participantList);
        } else {
          details.participants.forEach((email) => {
            participantList.appendChild(
              createParticipantRow(
                name,
                email,
                participantList,
                participantCount
              )
            );
          });
        }

        participantsSection.append(participantsHeading, participantList);
        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

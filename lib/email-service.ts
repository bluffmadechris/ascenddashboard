import emailjs from "@emailjs/browser"

// Initialize EmailJS with your user ID
// In a real app, you would store these in environment variables
const EMAILJS_USER_ID = "your_emailjs_user_id" // Replace with your actual EmailJS user ID
const EMAILJS_SERVICE_ID = "your_service_id" // Replace with your actual EmailJS service ID
const EMAILJS_TEMPLATE_ID = "your_template_id" // Replace with your actual EmailJS template ID

// Initialize EmailJS
export const initEmailJS = () => {
  emailjs.init(EMAILJS_USER_ID)
}

// Function to send meeting invitation emails
export const sendMeetingInvitation = async (
  meeting: {
    title: string
    start: string
    end: string
    description?: string
    location?: string
  },
  participants: {
    id: string
    name: string
    email: string
  }[],
  organizer: {
    name: string
    email: string
  },
): Promise<boolean> => {
  try {
    // Format the meeting time for display
    const startDate = new Date(meeting.start)
    const endDate = new Date(meeting.end)

    const formattedDate = startDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const formattedStartTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    const formattedEndTime = endDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    // Send email to each participant
    const emailPromises = participants.map((participant) => {
      const templateParams = {
        to_name: participant.name,
        to_email: participant.email,
        from_name: organizer.name,
        meeting_title: meeting.title,
        meeting_date: formattedDate,
        meeting_start_time: formattedStartTime,
        meeting_end_time: formattedEndTime,
        meeting_location: meeting.location || "Not specified",
        meeting_description: meeting.description || "No description provided",
        participant_list: participants.map((p) => p.name).join(", "),
      }

      return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
    })

    await Promise.all(emailPromises)
    return true
  } catch (error) {
    console.error("Error sending meeting invitations:", error)
    return false
  }
}

// Function to simulate sending emails (for development/testing)
export const simulateSendMeetingInvitation = (
  meeting: {
    title: string
    start: string
    end: string
    description?: string
    location?: string
  },
  participants: {
    id: string
    name: string
    email: string
  }[],
  organizer: {
    name: string
    email: string
  },
): boolean => {
  // Format the meeting time for display
  const startDate = new Date(meeting.start)
  const endDate = new Date(meeting.end)

  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const formattedStartTime = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

  const formattedEndTime = endDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

  // Log the email that would be sent
  console.log("===== MEETING INVITATION EMAIL =====")
  console.log(`From: ${organizer.name} <${organizer.email}>`)

  participants.forEach((participant) => {
    console.log(`To: ${participant.name} <${participant.email}>`)
  })

  console.log(`Subject: Meeting Invitation: ${meeting.title}`)
  console.log("\nEmail Content:")
  console.log("-----------------------------------")
  console.log(`Meeting: ${meeting.title}`)
  console.log(`Date: ${formattedDate}`)
  console.log(`Time: ${formattedStartTime} - ${formattedEndTime}`)
  console.log(`Location: ${meeting.location || "Not specified"}`)
  console.log(`\nDescription: ${meeting.description || "No description provided"}`)
  console.log(`\nParticipants: ${participants.map((p) => p.name).join(", ")}`)
  console.log("===================================")

  return true
}

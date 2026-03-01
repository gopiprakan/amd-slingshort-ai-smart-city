// Update this to your machine's local IP so your phone/emulator can reach Flask.
// Example: http://192.168.1.10:5001
const API_BASE_URL = "https://unvenomous-quirkily-mac.ngrok-free.dev";

type IssueData = {
  title: string;
  description: string;
  category: string;
  priority: string;
  images: string[];
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
};

type ApiResult = {
  success: boolean;
  data?: any;
};

export const submitReport = async (issueData: IssueData): Promise<ApiResult> => {
  try {
    // Use FormData because backend expects multipart/form-data.
    // This allows us to send both text fields and an optional image in one request.
    const form = new FormData();

    // Map mobile app fields to Flask backend fields.
    form.append("description", `${issueData.title} ${issueData.description}`.trim());
    form.append("latitude", String(issueData.location.latitude));
    form.append("longitude", String(issueData.location.longitude));
    form.append("severity", issueData.priority);
    form.append("people_affected", "10"); // Temporary fixed value
    form.append("near_sensitive_location", "false"); // Temporary fixed value

    // If user selected at least one image, send the first image file.
    // Do not set Content-Type header manually; fetch adds multipart boundary automatically.
    if (issueData.images && issueData.images.length > 0) {
      const imageUri = issueData.images[0];

      const filename = imageUri.split("/").pop() || "photo.jpg";
      const extMatch = /\.(\w+)$/.exec(filename);
      const fileType = extMatch ? `image/${extMatch[1]}` : `image/jpeg`;

      form.append("image", {
        uri: imageUri,
        name: filename,
        type: fileType,
      } as any);
    }

    console.log("Submitting to:", `${API_BASE_URL}/submit-complaint`);

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/submit-complaint`, {
        method: "POST",
        body: form,
      });
    } catch (error: any) {
      console.error("Submit error:", error);
      return {
        success: false,
        data: { message: error.toString() },
      };
    }

    const responseData = await response.json().catch(() => null);
    console.log("Response status:", response.status);
    console.log("Response data:", responseData);

    if (!response.ok) {
      return {
        success: false,
        data: responseData ?? { message: `Request failed with status ${response.status}` },
      };
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error: any) {
    console.error("Submit error:", error);
    return {
      success: false,
      data: {
        message: error.toString(),
      },
    };
  }
};

export const getAllComplaints = async (): Promise<ApiResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/complaints`, {
      method: "GET",
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        data: responseData ?? { message: `Request failed with status ${response.status}` },
      };
    }

    return {
      success: true,
      data: responseData,
    };
  } catch (error: any) {
    return {
      success: false,
      data: {
        message: error?.message || "Network error while fetching complaints",
      },
    };
  }
};

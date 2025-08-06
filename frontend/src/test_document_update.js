// Test script for updating a document via API

// Replace these values with your document ID and token
const documentId = 1; // Change to your document ID
const authToken = "YOUR_AUTH_TOKEN"; // Replace with your actual token

// API endpoint
const apiUrl = "http://localhost:8000/api";

// Update data
const updateData = {
  title: "TD Béton - Updated via API Test",
  document_type: "report",
  description: "This document was updated using a direct API call",
  department: 1, // Change to your department ID
  folder: 1, // Change to your folder ID
  tag_ids: [1, 2] // Change to your tag IDs
};

// Make the API call
async function testUpdateDocument() {
  try {
    console.log("Making API call to update document...");
    console.log(`Document ID: ${documentId}`);
    console.log("Update data:", updateData);
    
    const response = await fetch(`${apiUrl}/documents/${documentId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${authToken}`
      },
      body: JSON.stringify(updateData)
    });
    
    const responseData = await response.json();
    
    console.log(`Status code: ${response.status}`);
    if (response.ok) {
      console.log("Document updated successfully!");
      console.log("Response data:", responseData);
    } else {
      console.log("Failed to update document");
      console.log("Error:", responseData);
    }
  } catch (error) {
    console.error("API call failed:", error);
  }
}

// Run the test
testUpdateDocument();

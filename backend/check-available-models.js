import OpenAI from "openai";

const API_KEY = "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";
const BASE_URL = "https://integrate.api.nvidia.com/v1";

async function listModels() {
  const client = new OpenAI({
    baseURL: BASE_URL,
    apiKey: API_KEY,
  });

  try {
    const response = await client.models.list();
    const models = response.data;

    console.log("📋 AVAILABLE MODELS ON NVIDIA API\n");
    console.log(`Total: ${models.length} models\n`);

    // Find Mistral models
    const mistralModels = models.filter((m) =>
      m.id.toLowerCase().includes("mistral")
    );

    if (mistralModels.length > 0) {
      console.log("🎯 MISTRAL MODELS AVAILABLE:");
      mistralModels.forEach((m) => console.log(`   ✓ ${m.id}`));
      console.log();
    } else {
      console.log("⚠️  NO MISTRAL MODELS FOUND\n");
    }

    // Show all models
    console.log("📌 ALL AVAILABLE MODELS:");
    models.slice(0, 20).forEach((m) => console.log(`   ${m.id}`));
    console.log(`   ... and ${models.length - 20} more models\n`);

    // Try a test with each Mistral model if available
    if (mistralModels.length > 0) {
      console.log("🧪 TESTING FIRST MISTRAL MODEL:\n");
      const testModel = mistralModels[0].id;
      console.log(`Testing: ${testModel}\n`);

      try {
        const response = await client.chat.completions.create({
          model: testModel,
          messages: [{ role: "user", content: "Hello, say OK" }],
          max_tokens: 10,
        });
        console.log("✅ Model works!");
        console.log(`Response: ${response.choices[0].message.content}\n`);
      } catch (error) {
        console.log(`❌ Test failed: ${error.message}\n`);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();

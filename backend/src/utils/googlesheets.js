import { google } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../lib/credentials.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const getRowCount = async (sheets, sheetId) => {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "Sheet1!A2:A", // Column A, starting after header
  });

  return res.data.values ? res.data.values.length : 0;
};

export async function updateSheet(products) {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    const sheetId = "1Gh2T6oX8cwUzdV6gSVYvGYhyLXKSjkzD4-cnz3Y9-wI";
    const existingRowCount = await getRowCount(sheets, sheetId);
    const startingSN = existingRowCount + 1;
    const data = products.map((product, index) => [
      startingSN + index,
      new Date().toLocaleDateString(),
      product.modelName,
      product.name,
      product.costPrice,
      product.sellingPrice,
      product.parentCategory,
      product.parentSubcategory,
      product.color.map((c) => c.colorName).join(", "),
      product.stock,
      product.sellingPrice - product.costPrice,
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Sheet1!A2",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: data,
      },
    });
    console.log("Google Sheet updated successfully");
  } catch (error) {
    console.log("Error updating Google Sheet:", error.message);
  }
}

export async function deleteProductFromSheet(productName) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const sheetId = "1Gh2T6oX8cwUzdV6gSVYvGYhyLXKSjkzD4-cnz3Y9-wI";
  const sheetName = "Sheet1";

  // 1. Get existing rows
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A2:D`, // Up to column D
  });

  const rows = res.data.values;
  const rowIndex = rows.findIndex((row) => row[3] === productName); // Column D = index 3

  if (rowIndex === -1) {
    throw new Error("Product not found for deletion");
  }

  // 2. Get Sheet ID (not spreadsheetId) - required for deleteDimension
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const sheet = meta.data.sheets.find((s) => s.properties.title === sheetName);
  const sheetIdNum = sheet.properties.sheetId;

  // 3. Delete the row using batchUpdate
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    resource: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetIdNum,
              dimension: "ROWS",
              startIndex: rowIndex + 1, // skip header
              endIndex: rowIndex + 2,
            },
          },
        },
      ],
    },
  });

  console.log(`Product "${productName}" deleted from Google Sheet.`);
}

export async function updateProductInSheet(product) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: "v4", auth: client });

  const sheetId = "1Gh2T6oX8cwUzdV6gSVYvGYhyLXKSjkzD4-cnz3Y9-wI";
  const sheetName = "Sheet1";

  // --- helpers ---
  const toISODate = (val) => {
    if (!val) return new Date(); // fallback now
    // Mongoose Date or JS Date
    if (val instanceof Date) return val;
    // Firestore Timestamp-like
    if (typeof val === "object" && typeof val.toDate === "function")
      return val.toDate();
    // { seconds, nanoseconds }
    if (val && typeof val.seconds === "number")
      return new Date(val.seconds * 1000);
    // ISO string or something Date can parse
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const formatYYYYMMDD = (dateObj) => dateObj.toISOString().slice(0, 10);

  // Fetch existing data (can be undefined if sheet empty)
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A2:Z`,
  });

  const rows = res.data.values || [];

  // Find by product name in column D (index 3)
  const rowIndex = rows.findIndex((row = []) => row[3] === product.name);

  if (rowIndex === -1) {
    console.log("Product not found in sheet, skipping update.");
    return;
  }

  // Normalize fields
  const createdAtStr = formatYYYYMMDD(toISODate(product.createdAt));
  const modelName = product.modelName ?? "";
  const name = product.name ?? "";
  const costPrice = Number(product.costPrice ?? 0);
  const sellingPrice = Number(product.sellingPrice ?? 0);
  const parentCategory = product.parentCategory ?? "";
  const parentSubcategory = product.parentSubcategory ?? "";
  const colors = Array.isArray(product.color)
    ? product.color
        .map((c) => (typeof c === "string" ? c : c?.colorName))
        .filter(Boolean)
        .join(", ")
    : "";
  const stock = Number(product.stock ?? 0);
  const profit = sellingPrice - costPrice;

  const updatedRow = [
    rows[rowIndex]?.[0] ?? "", // keep same SN from sheet
    createdAtStr, // B
    modelName, // C
    name, // D
    costPrice, // E
    sellingPrice, // F
    parentCategory, // G
    parentSubcategory, // H
    colors, // I
    stock, // J
    profit, // K
  ];

  const updateRange = `${sheetName}!A${rowIndex + 2}:K${rowIndex + 2}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: updateRange,
    valueInputOption: "RAW", // or "USER_ENTERED" if you want Google to parse numbers/dates
    resource: { values: [updatedRow] },
  });

  console.log(`Google Sheet updated for product "${name}"`);
}

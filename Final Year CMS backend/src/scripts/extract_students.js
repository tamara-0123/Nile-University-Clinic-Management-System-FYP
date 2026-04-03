import fs from 'fs';
import path from 'path';

const RAW_PATH = "./src/data/raw_students.txt";
const OUTPUT_PATH = "./src/data/students.json";

function extract() {
  try {
    console.log(`Reading from ${RAW_PATH}...`);
    const text = fs.readFileSync(RAW_PATH, 'utf-8');

    // Split text by lines
    const lines = text.split("\n");
    const students = [];

    console.log(`Analyzing ${lines.length} lines of text...`);

    // Regular Expression to find Student ID (typically 6-10 digits) and Name
    // Matches: "1500123  JOHN DOE" or "1. 1500123 JOHN DOE"
    // Captures: Group 1 (ID), Group 2 (Name)
    const regex = /(\d{6,})\s+([A-Z\s\.]+)/;

    lines.forEach(line => {
      const match = line.match(regex);
      if (match) {
        const id = match[1].trim();
        let name = match[2].trim();

        // Cleanup name (remove trailing numbers or junk characters)
        name = name.replace(/[0-9].*$/, '').trim();

        // Exclude lines that look like headers or junk
        if (name.length > 2 && !name.includes("MATRIC") && !name.includes("NAME")) {
          students.push({
            studentID: id,
            name: name
          });
        }
      }
    });

    console.log(`Found ${students.length} students.`);
    if (students.length > 0) {
      console.log("First 5 entries:", students.slice(0, 5));
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(students, null, 2));
      console.log(`Saved to ${OUTPUT_PATH}`);
    } else {
      console.log("No valid students found. Please check raw_students.txt content.");
    }

  } catch (error) {
    console.error("Extraction Failed:", error);
  }
}

extract();

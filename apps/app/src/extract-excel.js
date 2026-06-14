const XLSX = require('xlsx');
const path = require('path');

// Charger le fichier Excel (corriger le chemin)
const workbook = XLSX.readFile(path.join(__dirname, '../../../cal reglementation.xlsx'));

// Récupérer le nom de la première feuille
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convertir la feuille en tableau JSON
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(data);

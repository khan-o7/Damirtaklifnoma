/**
 * Damir & Gulsina - To'y taklifnomasi uchun Google Sheets "backend"
 *
 * BU FAYLNI QANDAY O'RNATISH:
 * 1) https://sheets.google.com da yangi bo'sh jadval oching (masalan "Toy taklifnomasi").
 * 2) Yuqoridagi menyudan: Extensions -> Apps Script.
 * 3) Ochilgan oynadagi standart kodni o'chirib, shu faylning HAMMASINI joylashtiring.
 * 4) Yuqori o'ngdagi "Deploy" -> "New deployment" tugmasini bosing.
 *    - "Select type" (gear belgisi) -> "Web app" ni tanlang.
 *    - "Execute as": Me (sizning hisobingiz)
 *    - "Who has access": Anyone
 *    - "Deploy" tugmasini bosing, Google ruxsat so'raydi -> ruxsat bering.
 * 5) Sizga uzun bir URL beriladi, masalan:
 *    https://script.google.com/macros/s/AKfycb.../exec
 *    Shu URL'ni nusxalab oling va script.js faylidagi SHEETS_API_URL o'rniga qo'ying.
 *
 * Wishes va RSVP uchun ikkita varaq (Wishes, RSVP) birinchi so'rov kelganda
 * avtomatik yaratiladi, ular haqida qayg'urish shart emas.
 */

function doGet(e) {
  e = e || { parameter: {} }; // muharrirdan "Run" bilan sinalganda ham xato bermasligi uchun
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === "wishes") {
    return jsonResponse(getWishes(ss));
  }
  if (action === "rsvp") {
    return jsonResponse(getRSVP(ss));
  }
  if (action === "stats") {
    return jsonResponse(getStats(ss));
  }
  return jsonResponse({ error: "Noma'lum action: " + action });
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, error: "JSON o'qib bo'lmadi" });
  }

  if (data.type === "wish") {
    addWish(ss, data);
    return jsonResponse({ ok: true });
  }
  if (data.type === "rsvp") {
    addRSVP(ss, data);
    return jsonResponse({ ok: true });
  }
  return jsonResponse({ ok: false, error: "Noma'lum type: " + data.type });
}

// ---------------------------------------------------------------------------
// Varaqlarni olish/yaratish
// ---------------------------------------------------------------------------

function getWishesSheet(ss) {
  var sh = ss.getSheetByName("Wishes");
  if (!sh) {
    sh = ss.insertSheet("Wishes");
    sh.appendRow(["id", "ism", "xabar", "vaqt"]);
  }
  return sh;
}

function getRSVPSheet(ss) {
  var sh = ss.getSheetByName("RSVP");
  if (!sh) {
    sh = ss.insertSheet("RSVP");
    sh.appendRow(["id", "ism", "mehmonlar_soni", "holat", "izoh", "vaqt"]);
  }
  return sh;
}

// ---------------------------------------------------------------------------
// Yozish
// ---------------------------------------------------------------------------

function addWish(ss, data) {
  var sh = getWishesSheet(ss);
  var id = sh.getLastRow(); // header ham hisobga olinadi, shuning uchun id ustma-ust tushmaydi
  sh.appendRow([id, String(data.ism || "").trim(), String(data.xabar || "").trim(), new Date().toISOString()]);
}

function addRSVP(ss, data) {
  var sh = getRSVPSheet(ss);
  var id = sh.getLastRow();
  sh.appendRow([
    id,
    String(data.ism || "").trim(),
    Number(data.mehmonlar_soni) || 1,
    String(data.holat || ""),
    String(data.izoh || "").trim(),
    new Date().toISOString(),
  ]);
}

// ---------------------------------------------------------------------------
// O'qish
// ---------------------------------------------------------------------------

function getWishes(ss) {
  var sh = getWishesSheet(ss);
  var rows = sh.getDataRange().getValues();
  rows.shift(); // sarlavha qatorini olib tashlash
  return rows
    .map(function (r) {
      return { id: r[0], ism: r[1], xabar: r[2], vaqt: r[3] };
    })
    .reverse(); // eng yangisi birinchi
}

function getRSVP(ss) {
  var sh = getRSVPSheet(ss);
  var rows = sh.getDataRange().getValues();
  rows.shift();
  return rows
    .map(function (r) {
      return { id: r[0], ism: r[1], mehmonlar_soni: r[2], holat: r[3], izoh: r[4], vaqt: r[5] };
    })
    .reverse();
}

function getStats(ss) {
  var rows = getRSVP(ss);
  var jami = 0;
  var tasdiqlangan = 0;
  var kelaOlmaydi = 0;
  rows.forEach(function (r) {
    if (r.holat === "keladi") {
      jami += Number(r.mehmonlar_soni) || 0;
      tasdiqlangan += 1;
    } else if (r.holat === "kelolmaydi") {
      kelaOlmaydi += 1;
    }
  });
  return {
    jami_mehmonlar: jami,
    tasdiqlangan: tasdiqlangan,
    kela_olmaydi: kelaOlmaydi,
    jami_yozuvlar: rows.length,
  };
}

// ---------------------------------------------------------------------------
// Yordamchi
// ---------------------------------------------------------------------------

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

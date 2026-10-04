/**
 * Damir & Gulsina - To'y taklifnomasi uchun Google Sheets "backend"
 *
 * 1) Google Sheetsda yangi bo'sh jadval oching.
 * 2) Extensions -> Apps Script
 * 3) Bu faylni hammasi bilan o'rnating.
 * 4) Deploy -> New deployment -> Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5) Deploy qiling.
 * 6) URLni olish va script.js fayligacha qo'ying.
 */

var SHEET_ID = "1TfJ0QkTDX7yuFOH-1DmFG9fWzCd_xVjR1cBDTJOjYDs";

function getSpreadsheet() {
  if (SHEET_ID && SHEET_ID !== "PASTE_YOUR_SHEET_ID_HERE") {
    try {
      return SpreadsheetApp.openById(SHEET_ID);
    } catch (err) {
      // If sheet ID is wrong, fall back to active spreadsheet
    }
  }

  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    return null;
  }
}

function doGet(e) {
  e = e || { parameter: {} };
  var action = e.parameter.action;
  var ss = getSpreadsheet();

  if (!ss) {
    return jsonResponse({ ok: false, error: "Spreadsheet topilmadi. SHEET_ID ni to'g'ri kiriting." });
  }

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
  var ss = getSpreadsheet();

  if (!ss) {
    return jsonResponse({ ok: false, error: "Spreadsheet topilmadi. SHEET_ID ni to'g'ri kiriting." });
  }

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
// Sheet yaratish / olish
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
  var id = sh.getLastRow();
  sh.appendRow([
    id,
    String(data.ism || "").trim(),
    String(data.xabar || "").trim(),
    new Date().toISOString()
  ]);
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
    new Date().toISOString()
  ]);
}

// ---------------------------------------------------------------------------
// O'qish
// ---------------------------------------------------------------------------

function getWishes(ss) {
  var sh = getWishesSheet(ss);
  var rows = sh.getDataRange().getValues();
  rows.shift();

  return rows
    .map(function (r) {
      return {
        id: r[0],
        ism: r[1],
        xabar: r[2],
        vaqt: r[3]
      };
    })
    .reverse();
}

function getRSVP(ss) {
  var sh = getRSVPSheet(ss);
  var rows = sh.getDataRange().getValues();
  rows.shift();

  return rows
    .map(function (r) {
      return {
        id: r[0],
        ism: r[1],
        mehmonlar_soni: r[2],
        holat: r[3],
        izoh: r[4],
        vaqt: r[5]
      };
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
    jami_yozuvlar: rows.length
  };
}

// ---------------------------------------------------------------------------
// Yordamchi
// ---------------------------------------------------------------------------

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
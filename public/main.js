// https://gist.github.com/steveosoule/5980212

const ls = window.localStorage;
const fileReader = new FileReader();
const img = new Image();
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const inputFile = document.getElementById("uploadImage");
const lastImgData = ls.getItem('image');
const valuesTxt = {
    'Class' : document.getElementById('classValues'),
    'Section' : document.getElementById('sectionValues'),
    'Position' : document.getElementById('positionValues'),
    'House' : document.getElementById('houseValues'),
    'HouseColors' : document.getElementById('houseColors'),
} 
const fontTxt = document.getElementById('font');
const configTxtArea = document.getElementById('config');
const dataTxtArea = document.getElementById('data');
const checkFormatBtn = document.getElementById('checkFormat');
const updateConfigBtn = document.getElementById('updateConfig');
const fileNameTxt = document.getElementById('fileName');
const generateZipBtn = document.getElementById('generateZip');
const statusMsgSpan = document.getElementById('statusMessage');
const fields = {
    'SlNo': { regex: "\d+"},
    'Name': {regex: "\\w+(?: \w+)*", transform: titleCase},
    'Section': { values:['A','B','C','D','E','F', 'G', 'H']},
    'House':{ values:["Aakash", "Agni", "Prithvi", "Trishul"], transform: titleCase,
        colors:['#0000ff', '#ff0000', '#00ff00', '#ffd900']},
    'Class': { values:['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']},
    'Position': {values:['1st', '2nd', '3rd', '4th'], transform: ordinalNumber},
    'Date': {},
    'Title': {},
}

function titleCase(str) {
    return str.replace(/\w\S*/g, txt => (txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
}

const ordinalWords = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth']

function ordinalNumber(num) {
  const match = (num + "").match(/\d+/);
  if (match && match[0] > 0 && match[0] <= ordinalWords.length) {
      return ordinalWords[match[0]-1];
  } 
  else {
      return num;
  }
}


let itemFont = "25px serif";
let configItems = [];

let fileName = 'Class_Section_Position';

fileReader.onload = function (e) {
    console.log(typeof e.target.result, e.target.result instanceof Blob);
    img.src = e.target.result;
};

img.onload = function() {
    ls.setItem("image", img.src);
    drawImage();
}

inputFile.addEventListener('change', function() {
    const file = this.files[0];  
    return file && fileReader.readAsDataURL(file); 
})

// Draw the certificate along with all the text boxes
function drawImage() {
   // console.log(img.src);
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0); 
    context.fillStyle = fillStyle;
    context.font = itemFont;
    for(const item of configItems) {
        context.fillRect(item.x, item.y, item.x2 - item.x, thick);
        context.fillText(item.name, item.x, item.y)
    }
}

// Set values and eventHandlers for the Class, Section, Position, House and HouseColors input fields
for(const field in valuesTxt) {
    let arr = field === 'HouseColors' ? fields.House.colors : fields[field].values;
    valuesTxt[field].addEventListener('change', function(e) {
        const values = e.target.value.split(',').map(item => item.trim());
        arr.splice(0, arr.length, ...values);
        ls.setItem('values'+field, arr.join(","));
    });

    const value = ls.getItem('values'+field);
    if (value) {
        const values = value.split(',');
        valuesTxt[field].value = value;
        arr.splice(0, arr.length,  ...values);
    } else {
        valuesTxt[field].value = arr.join(",");
    }
}


function updateConfig() {
    let configStr = "";
    for(const item of configItems) {
        configStr = configStr + item.x + ", " + item.y + ", " + item.x2 + ", " + item.name + "\n";
    }
    configTxtArea.value = configStr;
    ls.setItem('config', configStr);
}

function parseConfig() {
    configItems = [];
    const items = configTxtArea.value.split("\n");
    const regex = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\w+)\s*$/;
    for(const itemStr of items) {
        if (!itemStr.trim()) {
            continue;
        }
        const match = itemStr.match(regex);
        if (!match) {
            console.error("Invalid pattern ", itemStr);
        } else {
            let [,x,y,x2,name] = match;
            configItems.push({x,y,x2, name});
        }
    }
}

// Add the event listener for the FONT input text
fontTxt.addEventListener('change', function(e) {
    ls.setItem('font', e.target.value);
    itemFont = e.target.value;
})

// update the value of FONT input text from local storage
if (ls.getItem('font')) {
    fontTxt.value = ls.getItem('font');
    itemFont = fontTxt.value;
} else {
    fontTxt.value = itemFont;
}

// Add the event listener for the FILENAME input text
fileNameTxt.addEventListener('change', function(e) {
    ls.setItem('fileName', e.target.value);
    fileName = e.target.value;
})

// update the value of FILENAME input text from local storage
if (ls.getItem('fileName')) {
    fileNameTxt.value = ls.getItem('fileName');
    fileName = fileNameTxt.value;
} else {
    fileNameTxt.value = fileName;
}



// Add the event listener for the CONFIG input text
configTxtArea.addEventListener('change', function(e) {
    ls.setItem('config', e.target.value)
})

// update the value of the CONFIG input text from local storage
if (ls.getItem('config')) {
    configTxtArea.value = ls.getItem('config');
    parseConfig();
    updateConfig();
} 



updateConfigBtn.addEventListener('click', function(e) {
    e.preventDefault();
    parseConfig();
    drawImage();
})

dataTxtArea.addEventListener('change', function(e) {
    ls.setItem('data', e.target.value)
})

checkFormatBtn.addEventListener('click', function(e) {
    e.preventDefault();
    const err = parseData();
    console.log(err);
    if (typeof err === "string") {
        showAlert(err);
    }
})

generateZipBtn.addEventListener('click', function(e) {
    e.preventDefault();
    generateZip();
})

/** parse the Items data textarea,
 * If there are no errors, return an array of objects. Otherwise return an error string
 */
function parseData() {
    const lines = dataTxtArea.value.split("\n");
    const columns = lines[0].split(" ");
    // Check of column names are valid
    for(let col of columns) {
        if (!fields[col]) {
            return "Invalid column '" + col + "'\n" + "Must be one of " 
            + Object.keys(fields).join(" ");
        }
    }
    // Check if house colors match up with houses 
    const houseField = fields.House;
    if (houseField.values.length !== houseField.colors.length) {
        console.log(houseField);
        return "Mismatched lengths for house colors:" +
            "\nHouses = " + houseField.values.join(",") + " Colors=" + houseField.colors.join(",");
    }

    // name can have spaces, so use "\w(+\w+)*.*\w+" for names, but for other columns use "\w+"
    const regex = new RegExp( '^' + 
        columns.map(col => col === 'Name' ? "(\\w+.*\\w+)" : "(\\w+)").join("\\s+") 
        + '$');
    const items = [];
    for(let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(regex);
        
        if (!match) {
            return  "Line " + (i+1) + " does not match format. \n" + lines[i];
        }
        const itemValues = match.slice(1).map((val, i) => [columns[i], val]);
        for(let [col, val] of itemValues) 
        {
            if (fields[col].values && fields[col].values.findIndex(v => v.toLowerCase() === val.toLowerCase()) <0) {
                return "Line " + (i+1) + " has wrong value for '" + col +"'. \n" + lines[i] +
                "\n Possible values: " + fields[col].values.join(",");
            }
        }
        items.push(Object.fromEntries(itemValues));
    }
    return items;
}

let selectingLine = false;
let imageData;
let offsetY = 0;
let offsetX = 0;
let offsetX2 = 0;

const thick = 2;
const fillStyle = 'blue';

// MOUSEDOWN on canvas. Start showing blue line
canvas.addEventListener('mousedown', function(e) {
    if (!selectingLine) {
        offsetX = e.offsetX;
        offsetY = e.offsetY;
        imageData = context.getImageData(0, offsetY, canvas.width, thick);
        context.fillStyle = fillStyle;
        context.fillRect(offsetX, offsetY, thick, thick);
        selectingLine = true;
    }
})

// MOUSEMOVE on canvas. Extend blue line horizontally
canvas.addEventListener('mousemove', function (e) {
    if (selectingLine) {
        offsetX2 = e.offsetX;
        context.putImageData(imageData, 0, offsetY);
        context.fillStyle = fillStyle;  
        context.fillRect(offsetX2 > offsetX ? offsetX : offsetX2, offsetY, Math.abs(offsetX2 - offsetX), thick);
    }
})

// MOUSEUP on canvas. Show the dialog to create an item
canvas.addEventListener('mouseup', function(e) {
    if (selectingLine) {
        selectingLine = false;
        enterItemDetails();
    }
})

// MOUSEOUT on canvas. Abandon the blue line
canvas.addEventListener('mouseout', function(e) {
    if (selectingLine) {
        // Cancel selection
        context.putImageData(imageData, 0, offsetY);
        selectingLine = false;
    }
})


/** the modal dialog */
let modalEl;

// Display the item dialog
function enterItemDetails() {
    modalEl = document.getElementById('itemDialog').cloneNode(true);
    modalEl.id = 'itemDialog1';
    modalEl.style.display = 'block';
    const selectElem = modalEl.getElementsByTagName('select')[0];
    Object.keys(fields).forEach(field => {
        const option = document.createElement("option");
        option.appendChild(document.createTextNode(field))
        selectElem.appendChild(option);
    });
    selectElem.id = 'itemName';
    mui.overlay('on', modalEl);
    selectElem.focus()
}

// When user clicks on CANCEL in item dialog
function cancelItemDetail() {
    context.putImageData(imageData, 0, offsetY);
    mui.overlay('off');
}

// When user clicks on OK in item dialog
function saveItemDetail() {
    configItems.push({x:offsetX, y:offsetY, x2:offsetX2, name:document.getElementById('itemName').value});
    console.log(configItems);
    mui.overlay('off');
    drawImage();
    updateConfig();
}


function showAlert(err) {
    modalEl = document.getElementById('alertDialog').cloneNode(true);
    modalEl.id = 'alertDialog1';
    modalEl.style.display = 'block';
    modalEl.firstElementChild.append(document.createTextNode(err));
    mui.overlay('on', modalEl);

}

function closeAlert() {
    mui.overlay('off');
}

// When user click on GENERATE-ZIP button
async function generateZip() {
    const records = parseData();
    const zip = new JSZip();
    console.log(records);
    let i = 0;
    for(const record of records) {
        context.drawImage(img, 0, 0); 
       
        context.font = itemFont;
        for(const item of configItems) {
            context.fillStyle = 'black';
            let value = record[item.name];
            if (fields[item.name].transform) {
                value = fields[item.name].transform(value);
            }
            if (item.name === "House") {
                const index = fields.House.values.findIndex(h => h.toLowerCase() === record[item.name].toLowerCase());
                console.log("House", record, item, index, fields.House);
                context.fillStyle = fields.House.colors[index];
            }
            context.fillText(value, item.x, item.y)
        }
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg"));
        const fileNameExpanded = fileName.replace(/[A-Za-z]+/g, txt => record[txt] ? record[txt] : txt);
        statusMsgSpan.innerText = " " + i + " : " + record.Name;
        zip.file(fileNameExpanded + ".jpg", blob);
        i++;
    }
    statusMsgSpan.innerText = "zipping...";
    const content = await zip.generateAsync({type:"blob"})
    // see FileSaver.js
    saveAs(content, "certificates.zip");
    
    // restore image
    drawImage();
    statusMsgSpan.innerText = "";
}



if (lastImgData) {
    img.src = lastImgData;  
}

if (ls.getItem('data')) {
    dataTxtArea.value = ls.getItem('data');
}

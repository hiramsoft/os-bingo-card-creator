import _ from 'lodash';
import moment from 'moment';
// Note: jsPDF has to be provided in the global document scope
// It does not play well with jspm as of July 2015

/**
 * Concepts to remember
 * - A board is the grid with BINGO at the top
 * - A page has boards
 * - A drawing is the call-out order at the end
 */

export default
{
    name: "BingoCardController",
    def: ['$log', '$scope', ($log, $scope) => {

        $scope.setDefaults = () => {
            $scope.wordList = `Buenos días.
Buenas tardes.
Buenas noches.
Hola, me llamo Juan.
¿Cómo se llama usted?
¿Cómo está usted?
Estoy bien.
Mucho gusto.
Adiós.
Hasta luego.
¿Dónde está el baño?
Con permiso. OR Perdóname
Por favor.
Gracías.
Lo siento.
Salud.
De nada.
¿Cuánto cuesta?
¿Cuántos hay?
Hay muchos.
¿Quiere comprarlo usted?
¿Qué hora es?
¿Cómo se dice maybe en Español?
Sí.
No.
Yo no comprendo.
Por favor, habla mas despacio.
¿Quièn?
¿Por què?
`;

            $scope.numPages = 4;
            $scope.numDrawings = 1;
            $scope.pageFormat = 'letter';
            $scope.freeSpaceText = 'Libre!';
            $scope.boardTitle = "Ms. Smith's Level 1 Spanish Vocab Chapter 1";
            $scope.numBoardsPerPage = 4;
        };

        $scope.pdfFrame = document.getElementById('bingo_card_output');

        $scope.drawCenterText = (doc, leftX, rightX, topY, bottomY, text) => {
            var XWidth = rightX - leftX;
            var YHeight = bottomY - topY;
            var midpointX = XWidth / 2;
            var midpointY = YHeight / 2;


            var lines = doc.splitTextToSize(text, XWidth);
            var typicalDims = doc.getTextDimensions(lines[0]);
            var totalY = typicalDims.h * lines.length;
            var startY = bottomY - midpointY - (totalY / 2);
            if(doc.internal.getFontSize() > 16)
            {
                startY += (totalY / 3);
            }
            for(var i=0;i<lines.length;i++) {
                var line = lines[i];
                var dims = doc.getTextDimensions(line);
                var XPos = leftX + midpointX - (dims.w / 2);
                //console.log("Line = ", line, "typicalDims = ", typicalDims, "dims =", dims);
                var YPos = startY + (dims.h * (i) + (typicalDims.h / 2));
                doc.text(XPos, YPos, line);
            }
        };

        $scope.addPageNum = (doc, settings) => {
            if(settings.showPageNums){
                $scope.drawCenterText(doc, 0, settings.pageWidth, settings.pageHeight - 50, settings.pageHeight, "Page " + settings.pageNum);
            }
        };

        $scope.addPage = (doc, settings) => {
            settings.pageNum++;
            doc.addPage();
        };

        /**
         * Input provided by $scope:
         * - $scope.wordList
         * - $scope.numPages
         * - $scope.numDrawings
         * - $scope.pageFormat
         * - $scope.freeSpaceText
         * - $scope.boardTitle
         * - $scope.drawingTitleText
         * - $scope.showPageNums
         * - (probably others, assume this list is out of date and check the settings assignment below)
         *
         * Stages:
         * 1) Identify words for each bingo card
         * 2) Create one HTML table per card in a hidden DOM
         * 3) Render the HTML in the PDF
         * 4) Randomly order the words for drawings
         * 5) Render the lists with a title "Drawing #"
         *
         * Output:
         * - $scope.downloadLink
         * - $scope.pdfFrame.src is set to downloadLink
         * - $scope.errorMessage is set or null
         * - $scope.generating is toggled appropriately
         */
        $scope.generateBingoCard = () => {
            // TODO: Eventually support A4 for our European friends
            $scope.generating = true;
            $scope.errorMessage = null;
            $scope.downloadLink = null;
            var settings = {
                pageFormat : $scope.pageFormat || 'letter', // || 'a4',
                pageWidth : 612,
                pageHeight :  792,
                pageTop : 0,
                pageLeft : 0,
                boardsPerPage : $scope.numBoardsPerPage || 1,

                wordsPerBoard : 24,
                freeSpaceText : $scope.freeSpaceText || "Free!",
                titleText : $scope.boardTitle || "Bingo!",
                drawingTitleText : $scope.drawingTitleText || "Drawing Order #",
                showPageNums : $scope.showPageNums || false,
                pageNum : 1
            };
            if(settings.pageFormat == 'a4')
            {
                settings.pageWidth = 595.28;
                settings.pageHeight = 841.89;
            }
            var doc = new jsPDF('p', 'pt', settings.pageFormat);

            var words = _($scope.wordList.split("\n")).map( (word) => word.trim() ).filter( (word) => word.length > 0 ).value();

            if(words.length < 24)
            {
                $scope.errorMessage = "There's not enough words! I count " + words.length + " words, but we need at least 24";
                $scope.generating = false;
                return;
            }

            for(var i=0;i<$scope.numPages;i++)
            {
                var boards = [];
                for (var b = 0; b < $scope.numBoardsPerPage; b++) {
                    boards[b] = _.take(_.shuffle(words), settings.wordsPerBoard);
                }
                if($scope.numBoardsPerPage == 1)
                {
                    doc.setFontSize(16);
                    $scope.renderBoard(settings, doc, boards[0]);
                }
                else {
                    doc.setFontSize(8);
                    var tlSettings = _.cloneDeep(settings);
                    tlSettings.pageHeight = settings.pageHeight / 2;
                    tlSettings.pageWidth = settings.pageWidth / 2;
                    tlSettings.pageTop = settings.pageTop + tlSettings.pageHeight / 10;
                    tlSettings.pageLeft = tlSettings.pageWidth / 20;
                    $scope.renderBoard(tlSettings, doc, boards[0]);

                    var trSettings = _.cloneDeep(settings);
                    trSettings.pageHeight = settings.pageHeight / 2;
                    trSettings.pageWidth = settings.pageWidth / 2;
                    trSettings.pageTop = settings.pageTop + trSettings.pageHeight / 10;
                    trSettings.pageLeft = trSettings.pageWidth - trSettings.pageWidth / 20;
                    $scope.renderBoard(trSettings, doc, boards[1]);

                    var blSettings = _.cloneDeep(settings);
                    blSettings.pageHeight = settings.pageHeight / 2;
                    blSettings.pageWidth = settings.pageWidth / 2;
                    blSettings.pageTop = blSettings.pageHeight - blSettings.pageHeight / 10;
                    blSettings.pageLeft = blSettings.pageWidth / 20;
                    $scope.renderBoard(blSettings, doc, boards[2]);

                    var brSettings = _.cloneDeep(settings);
                    brSettings.pageHeight = settings.pageHeight / 2;
                    brSettings.pageWidth = settings.pageWidth / 2;
                    brSettings.pageTop = brSettings.pageHeight - blSettings.pageHeight / 10;
                    brSettings.pageLeft = brSettings.pageWidth - brSettings.pageWidth / 20;
                    $scope.renderBoard(brSettings, doc, boards[3]);
                }

                $scope.renderTitle(settings, doc);
                if(i < $scope.numPages - 1)
                {
                    $scope.addPageNum(doc, settings);
                    $scope.addPage(doc, settings);
                }
            }

            if($scope.numDrawings > 0)
            {
                $scope.addPageNum(doc, settings);
                $scope.addPage(doc, settings);
            }

            for(var i=0;i<$scope.numDrawings;i++)
            {
                var drawing = _.shuffle(words);
                $scope.renderDrawing(settings, doc, drawing, settings.drawingTitleText + (i+1));
                if(i < $scope.numDrawings - 1)
                {
                    $scope.addPageNum(doc, settings);
                    $scope.addPage(doc, settings);
                }
            }

            // last page
            $scope.addPageNum(doc, settings);

            $scope.pdfFrame.setAttribute('src', doc.output('datauristring'));
            $scope.downloadLink = $scope.pdfFrame.getAttribute('src');
            var now = moment().format('llll');
            $('.bingo-card-download').each( (index, aHref) => {
                aHref.setAttribute('download', 'OneStepBingoCard from ' + now + ".pdf");
            });
            $scope.generating = false;
        };

        $scope.renderDrawing = (settings, doc, drawingData, title) => {

            // MAX_LINES_PER_PAGE is the magic number of max rows per letter and A4
            var MAX_LINES_PER_PAGE = 30;
            var drawingChunks = _.chunk(drawingData, MAX_LINES_PER_PAGE);
            if(drawingChunks.length > 1)
            {
                for(var i=0;i<drawingChunks.length;i++)
                {
                    var drawingChunk = drawingChunks[i];
                    $scope.drawCenterText(doc, 0, settings.pageWidth, 75, settings.pageHeight, drawingChunk);

                    var chunkPageTitle = title + " (" + (i+1) + " / " + drawingChunks.length + ")";

                    doc.setFont("helvetica");
                    doc.setFontType("bold");
                    doc.setTextColor(0);
                    $scope.drawCenterText(doc, 0, settings.pageWidth, 0, 75, chunkPageTitle);
                    doc.setFontType("normal");

                    if(i < drawingChunks.length - 1)
                    {
                        $scope.addPageNum(doc, settings);
                        $scope.addPage(doc, settings);
                    }
                }
            }
            else
            {
                var drawingChunk = drawingChunks[0];
                $scope.drawCenterText(doc, 0, settings.pageWidth, 100, settings.pageHeight, drawingChunk);

                doc.setFont("helvetica");
                doc.setFontType("bold");
                doc.setTextColor(0);
                $scope.drawCenterText(doc, 0, settings.pageWidth, 0, 100, title);
                doc.setFontType("normal");
            }
        };

        $scope.renderBoard = (settings, doc, boardData) => {
            var rectWidth = settings.pageWidth / 6;
            var rectMidpoint = rectWidth / 2;
            var marginLeft = settings.pageLeft + (rectWidth / 2);
            var marginTop = settings.pageTop + (rectWidth) ;
            var textMargin = 4;
            var bingoText = ['B', 'I', 'N', 'G', 'O'];
            var normalFontSize = doc.internal.getFontSize();

            var wordI = 0;
            for(var r=0;r<6;r++)
            {
                for(var c=0;c<5;c++)
                {
                    var xPos = (marginLeft + rectWidth * c);
                    var yPos = (marginTop + rectWidth * r);

                    var textXPos = xPos + rectMidpoint;
                    var textYPos = yPos + rectMidpoint;

                    var text = "";

                    if(r == 3 && c == 2)
                    {
                        doc.setDrawColor(0);
                        doc.setFillColor(200);
                        doc.rect(xPos, yPos, rectWidth, rectWidth, 'FD');
                        text = settings.freeSpaceText;
                    }
                    else if (r == 0)
                    {
                        doc.rect(xPos, yPos, rectWidth, rectWidth);
                        //doc.setTextColor(255, 0, 0);
                        doc.setFontType("bold");
                        text = bingoText[c];
                        doc.setFontSize(normalFontSize * 4);
                    }
                    else
                    {
                        doc.rect(xPos, yPos, rectWidth, rectWidth);
                        text = boardData[wordI];
                        wordI++;
                    }

                    $scope.drawCenterText(doc, xPos + textMargin, xPos + rectWidth - textMargin, yPos + textMargin, yPos + rectWidth - textMargin, text);
                    doc.setTextColor(0);
                    doc.setFontType("normal");
                    doc.setFontSize(normalFontSize);
                }
            }
        };

        $scope.renderTitle = (settings, doc) => {
            var rectWidth = settings.pageWidth / 6;
            var marginTop = settings.pageTop + rectWidth ;

            doc.setFont("helvetica");
            doc.setFontType("bold");
            doc.setFontSize(22);
            doc.setTextColor(0);
            $scope.drawCenterText(doc, 0, settings.pageWidth, 0, marginTop, settings.titleText);
            doc.setFontType("normal");
            doc.setFontSize(16);
        };

        // what to do once when the scope becomes available
        $scope.setDefaults();
        $scope.generateBingoCard(); // want to have the PDF pre-loaded

    }]
};
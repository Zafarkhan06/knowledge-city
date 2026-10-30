// Connects the page to BillSplit (calc.js). It only moves text between the fields and the result.
(function () {
  'use strict';

  var form = document.getElementById('split-form');
  var inputs = {
    bill: document.getElementById('bill'),
    tip: document.getElementById('tip'),
    people: document.getElementById('people'),
  };
  var result = document.getElementById('result');
  var resultTip = document.getElementById('result-tip');
  var resultTotal = document.getElementById('result-total');
  var resultShares = document.getElementById('result-shares');
  var resultNote = document.getElementById('result-note');

  function showResult(lines) {
    resultTip.textContent = lines.tip;
    resultTotal.textContent = lines.total;
    resultShares.textContent = '';
    lines.shares.forEach(function (line) {
      var item = document.createElement('li');
      item.textContent = line;
      resultShares.appendChild(item);
    });
    resultNote.textContent = lines.note;
    resultNote.hidden = lines.note === '';
    result.hidden = false;
  }

  function hideResult() {
    result.hidden = true;
  }

  // Calculate is the form's submit button, so pressing Enter in any field also lands here.
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var outcome = BillSplit.calculate(inputs.bill.value, inputs.tip.value, inputs.people.value);
    if (outcome.ok) showResult(outcome.lines);
    else hideResult(); // messages for input that can't be used arrive with S-3 and S-4
  });
})();

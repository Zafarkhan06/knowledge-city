// Connects the page to BillSplit (calc.js). It only moves text between the fields and the result.
(function () {
  'use strict';

  var form = document.getElementById('split-form');
  var inputs = {
    bill: document.getElementById('bill'),
    tip: document.getElementById('tip'),
    people: document.getElementById('people'),
  };
  var messages = {
    bill: document.getElementById('bill-error'),
    tip: document.getElementById('tip-error'),
    people: document.getElementById('people-error'),
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

  var NO_MESSAGES = { bill: '', tip: '', people: '' };

  // Writes one field's message ('' clears it). The field is marked invalid (red border) only
  // while it has message text, so the border never appears on its own.
  function setMessage(name, text) {
    messages[name].textContent = text;
    if (text) inputs[name].setAttribute('aria-invalid', 'true');
    else inputs[name].removeAttribute('aria-invalid');
  }

  function showMessages(texts) {
    Object.keys(messages).forEach(function (name) {
      setMessage(name, texts[name]);
    });
  }

  // Calculate is the form's submit button, so pressing Enter in any field also lands here.
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var outcome = BillSplit.calculate(inputs.bill.value, inputs.tip.value, inputs.people.value);
    if (outcome.ok) {
      showMessages(NO_MESSAGES);
      showResult(outcome.lines);
    } else {
      showMessages(outcome.messages);
      hideResult();
    }
  });

  // Any edit removes the result straight away, so an old result never sits next to changed
  // numbers. It also removes the edited field's own message; other messages stay until Calculate.
  Object.keys(inputs).forEach(function (name) {
    inputs[name].addEventListener('input', function () {
      hideResult();
      setMessage(name, '');
    });
  });

  document.getElementById('start-over').addEventListener('click', function () {
    form.reset();
    showMessages(NO_MESSAGES);
    hideResult();
    inputs.bill.focus();
  });
})();

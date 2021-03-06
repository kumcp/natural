/*
  Unit test for Brill's POS Trainer
  Copyright (C) 2018 Hugo W.L. ter Doest

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var natural = require('../lib/natural');
var SentenceClass = natural.Sentence;
var fs = require('fs');

var base_folder_test_data = './spec/test_data/';
var brownCorpusFile = base_folder_test_data + 'browntag_nolines_excerpt.txt';

function selectRuleTemplates(templateNames) {
  var templates = [];
  templateNames.forEach(function(name) {
    if (natural.RuleTemplates[name]) {
      template = new natural.RuleTemplate(name, natural.RuleTemplates[name]);
      templates.push(template);
    }
  });
  return templates;
}

describe('Brill\'s POS Trainer', function() {
  var data = null;
  var corpus = null;
  var BROWN = 1;
  var percentageTrain = 60;
  var trainLexicon = null;
  // Templates consider only tags, no words
  var templateNames = [
    "NEXT-TAG",
    "PREV-TAG",
    "PREV-1-OR-2-OR-3-TAG",
    "PREV-1-OR-2-TAG",
    "NEXT1OR2TAG",
    "NEXT1OR2OR3TAG",
    "SURROUNDTAG",
    "PREV2TAG",
    "NEXT2TAG"
  ];
  var templates = null;
  var trainer = null;
  var ruleSet = null;

  it('should read a file with corpus', function() {
    data = fs.readFileSync(brownCorpusFile, 'utf8');
    expect(data).not.toBe("");
  });

  it('should process the corpus', function() {
    corpus = new natural.Corpus(data, BROWN, SentenceClass);
    expect(corpus.nrSentences()).toBeGreaterThan(0);
    expect(corpus.nrWords()).toBeGreaterThan(0);
  });

  it('should split the corpus in a training and testing corpus', function() {
    corpora = corpus.splitInTrainAndTest(percentageTrain);
    expect(corpora[0].nrSentences() + corpora[1].nrSentences()).toEqual(corpus.nrSentences());
  });

  it('should build a lexicon from the training corpus', function() {
    trainLexicon = corpora[0].buildLexicon();
    // Set default category to noun (NN)
    // and default category for capitalised words to proper noun (NP)
    trainLexicon .setDefaultCategories("NN", "NP");
    expect(trainLexicon.nrEntries()).not.toEqual(0);
  });

  it('should set up the rule templates', function() {
    templates = selectRuleTemplates(templateNames);
    expect(templates.length).toEqual(templateNames.length);
  });

  it('should train on the training corpus to derive transformation rules', function() {
    trainer = new natural.BrillPOSTrainer(1);
    ruleSet = trainer.train(corpora[0], templates, trainLexicon);
    expect(ruleSet.nrRules()).toBeGreaterThan(0);
  });

  it('should test the derived transformation rules on the test corpus', function() {
    var tagger = new natural.BrillPOSTagger(trainLexicon, ruleSet);
    var tester = new natural.BrillPOSTester();
    var scores = tester.test(corpora[1], tagger);
    expect(scores[1]).toBeGreaterThan(0);
  });

});

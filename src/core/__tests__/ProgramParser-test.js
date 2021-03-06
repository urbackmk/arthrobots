jest.dontMock('../Class');
jest.dontMock('../Robot');
jest.dontMock('../World');
jest.dontMock('../lang');
jest.dontMock('../ProgramParser');

var World = require('../World').default;
var Robot = require('../Robot').default;
var TOKENS = require('../ProgramParser').TOKENS;
var ProgramParser = require('../ProgramParser').default;
var getParser = function(code) {
  return new ProgramParser(code.join('\n'), (new World()).robot);
}

describe('lang parser', function() {

  it("should properly parse tokens", function() {
    var parser = getParser(['move'])
    expect(parser.getToken()).toBe(TOKENS.IDENTIFIER);
    expect(parser.getToken()).toBe(TOKENS.EOF);

    parser = getParser([
      'move',
      'move'])
    expect(parser.getNumTokens()).toBe(3);

    parser = getParser([
      'move',
      'move'])
    expect(parser.getToken()).toBe(TOKENS.IDENTIFIER);
    expect(parser.getToken()).toBe(TOKENS.NEWLINE);
    expect(parser.getToken()).toBe(TOKENS.IDENTIFIER);
    expect(parser.getToken()).toBe(TOKENS.EOF);

    parser = getParser([
      'define turnright:',
      '  do 3:',
      '    turnleft',
      '',
      'if facing_north:',
      '  turnright',
      ''])
    var tokens = []
    var currentToken;
    while ((currentToken = parser.getToken()) != TOKENS.EOF) {
      tokens.push(currentToken)
    }
    expect(tokens).toEqual([
      TOKENS.DEFINE,
      TOKENS.IDENTIFIER,
      TOKENS.COLON,
      TOKENS.NEWLINE,
      TOKENS.INDENT,
      TOKENS.DO,
      TOKENS.NUMBER,
      TOKENS.COLON,
      TOKENS.NEWLINE,
      TOKENS.INDENT,
      TOKENS.IDENTIFIER,
      TOKENS.NEWLINE,
      TOKENS.DEDENT,
      TOKENS.DEDENT,
      TOKENS.NEWLINE,
      TOKENS.IF,
      TOKENS.IDENTIFIER,
      TOKENS.COLON,
      TOKENS.NEWLINE,
      TOKENS.INDENT,
      TOKENS.IDENTIFIER,
      TOKENS.NEWLINE,
      TOKENS.DEDENT
    ]);
  });

  it("testCommand", function(){
    var block = getParser(['move']).parse();
    expect(block.expressions.length).toBe(1);
    expect(block.expressions[0].callable).toBe(new Robot().move);
    expect(block.expressions[0].line).toBe(0);
  });

  it("testDo", function(){
    var block = getParser([
      'do 3:',
      '  move']).parse();
    expect(block.expressions.length).toBe(1);
    expect(block.expressions[0].callable).toBe(new Robot()["do"]);
    expect(block.expressions[0].line).toBe(0);
    expect(block.expressions[0].block.expressions.length).toBe(1);
    expect(block.expressions[0].count).toBe(3);
    expect(block.expressions[0].block.expressions[0].callable).toBe(new Robot().move);
  });

  it("testIf", function(){
    var block = getParser(['if front_is_clear:',
                  '  move']).parse();
    expect(block.expressions.length).toBe(1);
    expect(block.expressions[0].name).toBe('if');
    expect(block.expressions[0].callable).toBe(new Robot().front_is_clear);
    expect(block.expressions[0].line).toBe(0);
    expect(block.expressions[0].block.expressions.length).toBe(1);
    expect(block.expressions[0].block.expressions[0].callable).toBe(new Robot().move);
    expect(block.expressions[0].block.expressions[0].line).toBe(1);
  });

  it("testElse", function(){
    var block = getParser(['if front_is_clear:',
                  '  move',
                  'else:',
                  '  turnleft']).parse();
    expect(block.expressions.length).toBe(1);
    expect(block.expressions[0].name).toBe('if');
    expect(block.expressions[0].callable).toBe(new Robot().front_is_clear);
    expect(block.expressions[0].line).toBe(0);
    expect(block.expressions[0].block.expressions.length).toBe(1);
    expect(block.expressions[0].block.expressions[0].callable).toBe(new Robot().move);
    expect(block.expressions[0].block.expressions[0].line).toBe(1);
    expect(block.expressions[0].elseBlock.expressions.length).toBe(1);
    expect(block.expressions[0].elseBlock.expressions[0].callable).toBe(new Robot().turnleft);
    expect(block.expressions[0].elseBlock.expressions[0].line).toBe(3);
  });

  it("testElif", function(){
    var block = getParser(['if front_is_clear:',
                  '  move',
                  'elif facing_north:',
                  '  putbeeper',
                  'elif facing_south:',
                  '  pickbeeper',
                  'else:',
                  '  turnleft']).parse();
    expect(block.expressions.length).toBe(1);
    expect(block.expressions[0].elifs.length).toBe(2);
    expect(block.expressions[0].elifs[0].callable).toBe(new Robot().facing_north);
    expect(block.expressions[0].elifs[0].line).toBe(2);
    expect(block.expressions[0].elifs[1].callable).toBe(new Robot().facing_south);
    expect(block.expressions[0].elifs[1].line).toBe(4);
  });

  it("testWhile", function(){
    var block = getParser([
      'while front_is_clear:',
      '  move']).parse();
    expect(block.expressions.length).toBe(1);
    expect(block.expressions[0].name).toBe('while');
    expect(block.expressions[0].callable).toBe(new Robot().front_is_clear);
    expect(block.expressions[0].line).toBe(0);
    expect(block.expressions[0].block.expressions.length).toBe(1);
    expect(block.expressions[0].block.expressions[0].callable).toBe(new Robot().move);
    expect(block.expressions[0].block.expressions[0].line).toBe(1);
  });

  it("testDefine", function(){
    var block = getParser([
      'define turnright:',
      '  do 3:',
      '    turnleft']).parse();
    expect(block.expressions.length).toBe(1);
    expect(block.expressions[0].name).toBe('turnright');
    expect(block.expressions[0].line).toBe(0);
    expect(block.expressions[0].block.expressions.length).toBe(1);
    expect(block.expressions[0].block.expressions[0].line).toBe(1);
    expect(block.expressions[0].block.expressions[0].count).toBe(3);
    expect(block.expressions[0].block.expressions[0].block.expressions[0].callable).toBe(new Robot().turnleft);
  });

  it("testFunctionCall", function(){
    var block = getParser([
      'define turnright:',
      '  do 3:',
      '    turnleft',
      'turnright']).parse();
    expect(block.expressions.length).toBe(2);
    expect(block.expressions[1].fname).toBe('turnright');
  });

  it("testMultilineBlock", function(){
    var block = getParser(['while front_is_clear:',
                  '  move',
                  '  move',
                  '  turnleft',
                  'move']).parse();
    expect(block.expressions.length).toBe(2);
    expect(block.expressions[0].block.expressions.length).toBe(3);
  });

  it("testSyntaxError", function(){
    var parser = getParser(['do n: move']);
    try{
      parser.parse();
    } catch (e){
      expect(e.message).toBe("Expected number after do. line: 1");
    }
  });

  it("should throw an error for invalid if conditions", function() {
    var parser = getParser([
      'if not-a-valid-condition:',
      '  move'])
    try {
      parser.parse();
    } catch (e) {
      expect(e.message).toBe('Unrecognized conditional expression "not". line: 1');
    }
  })

  it("should throw an error for invalid elif conditions", function() {
    var parser = getParser([
      'if facing_north:',
      '  move',
      'elif not-a-valid-condition:',
      '  move'])
    try {
      parser.parse();
    } catch (e) {
      expect(e.message).toBe('Unrecognized conditional expression "not". line: 3');
    }
  })

  it("should throw an error for missing conditions after if/elif/while", function() {
    var parser = getParser([
      'if:',
      '  move'])
    try { parser.parse() }
    catch (e) {
      expect(e.message).toBe('Expected a conditional expression after an if. line: 1')
    }

    parser = getParser([
      'if facing_north:',
      '  move',
      'elif:',
      '  move'])
    try { parser.parse() }
    catch (e) {
      expect(e.message).toBe('Expected a conditional expression after an elif. line: 3')
    }

    parser = getParser([
      'while:',
      '  move'])
    try { parser.parse() }
    catch (e) {
      expect(e.message).toBe('Expected a conditional expression after a while. line: 1')
    }
  })

  it("should throw an error when elif or else is in the wrong order", function() {
    var parser = getParser([
      'elif:',
      '  move'])
    try { parser.parse() }
    catch (e) {
      expect(e.message).toBe('elif statement can only come after an if statement. line: 1')
    }

    var parser = getParser([
      'else:',
      '  move'])
    try { parser.parse() }
    catch (e) {
      expect(e.message).toBe('else statement can only come after an if statement. line: 1')
    }
  })

  it("should throw an error for missing function names after define", function() {
    var parser = getParser([
      'define:',
      '  move'])
    try { parser.parse() }
    catch (e) {
      expect(e.message).toBe('Expected a function name after define. line: 1')
    }
  })

  it("should throw an error for missing colons and indents for new blocks", function() {
    var parser = getParser([
      'define foo',
      '  move'])
    try { parser.parse() }
    catch (e) {
      expect(e.message).toBe('Expected a colon. line: 1')
    }

    var parser = getParser([
      'define foo bar',
      '  move'])
    try { parser.parse() }
    catch (e) {
      expect(e.message).toBe('Expected a colon. line: 1')
    }

    var parser = getParser([
      'define foo: move'])
    try { parser.parse() }
    catch (e) {
      expect(e.message).toBe('Expected a newline. line: 1')
    }

    var parser = getParser([
      'define foo:',
      'move'])
    try { parser.parse() }
    catch (e) {
      expect(e.message).toBe('Expected an indented block. line: 2')
    }
  })

  it("should allow multiple newlines at the beginning of a block", function() {
    var parser = getParser([
      'define foo:',
      '  ',
      '',
      '  move'])
    expect(parser.getNumTokens()).toBe(8)
  })

  it("should ignore comments", function() {
    var parser = getParser([
      'define foo:',
      '  # this is the foo function',
      '  move'])
    expect(parser.getNumTokens()).toBe(7)
  })

  xit("should be able to compile to a js script by calling wrapJSForEval", function() {
    var parser = getParser(['move();'])
    var js = parser.wrapJSForEval()
    expect(js).toBe(`(function(init,toString,move,turnleft,pickbeeper,putbeeper,turnoff,facing_north,facing_south,facing_east,facing_west,any_beepers_in_beeper_bag,next_to_a_beeper,front_is_blocked,left_is_blocked,right_is_blocked,not_facing_north,not_facing_south,not_facing_east,not_facing_west,no_beepers_in_beeper_bag,not_next_to_a_beeper,front_is_clear,left_is_clear,right_is_clear){
move();})(robot.init,robot.toString,robot.move,robot.turnleft,robot.pickbeeper,robot.putbeeper,robot.turnoff,robot.facing_north,robot.facing_south,robot.facing_east,robot.facing_west,robot.any_beepers_in_beeper_bag,robot.next_to_a_beeper,robot.front_is_blocked,robot.left_is_blocked,robot.right_is_blocked,robot.not_facing_north,robot.not_facing_south,robot.not_facing_east,robot.not_facing_west,robot.no_beepers_in_beeper_bag,robot.not_next_to_a_beeper,robot.front_is_clear,robot.left_is_clear,robot.right_is_clear)`)
  })
})

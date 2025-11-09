// ********************** Initialize server **********************************

const server = require('../index.js');

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

//added: import database connection
const db = require('../config/database');

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

describe('Testing Add User API', () => {
  //cleanup test cases
  before(async function() {
    try {
      await db.none(`DELETE FROM users WHERE username IN ('testusername', 'duplicateuser')`);
      console.log('Test users cleaned up successfully');
    } catch (err) {
      console.log('Cleanup before tests:', err.message);
    }
  });
  //positive test case
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'testusername', email: 'Johndoe@gmail.com', password: 'asdfghjkl'})
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals('Success');
        done();
      });
  });
  //negative test case
  it('negative: /register - duplicate username', done => {
    chai
      .request(server)
      .post('/register')
      .send({ username: 'duplicateuser', email: 'dup@example.com', password: 'password123' })
      .end(() => {
        chai
          .request(server)
          .post('/register')
          .send({ username: 'duplicateuser', email: 'dup2@example.com', password: 'password123' })
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equals('Username already exists');
            done();
          });
      });
  });
});
// ********************************************************************************
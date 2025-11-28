// ********************** Initialize server **********************************

const server = require('../src/index.js'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai');
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

const db = require('../src/config/database');

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

// ********************** Test cases ****************************


describe('Testing Add User API', () => {
  //cleanup test cases
  before(async function() {
    try {
      await db.none(`TRUNCATE users RESTART IDENTITY CASCADE`);
      console.log('Test users cleaned up successfully');
    } catch (err) {
      console.log('Cleanup before tests:', err.message);
    }
  });
  
  //positive test case - check for redirect (302) since route redirects on success
  it('positive : /register', done => {
    chai
      .request(server)
      .post('/register')
      .send({username: 'testusername', email: 'Johndoe@gmail.com', password: 'asdfghjkl'})
      .redirects(0) // Don't follow redirects
      .end((err, res) => {
        expect(res).to.have.status(302);
        expect(res).to.redirectTo(/\/login/);
        done();
      });
  });
  
  //negative test case - duplicate also redirects back to /register with error
  it('negative: /register - duplicate username', done => {
    chai
      .request(server)
      .post('/register')
      .send({ username: 'duplicateuser', email: 'dup@example.com', password: 'password123' })
      .redirects(0)
      .end(() => {
        chai
          .request(server)
          .post('/register')
          .send({ username: 'duplicateuser', email: 'dup2@example.com', password: 'password123' })
          .redirects(0)
          .end((err, res) => {
            expect(res).to.have.status(302);
            expect(res).to.redirectTo(/\/register/);
            done();
          });
      });
  });
});
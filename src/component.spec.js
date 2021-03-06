import R from 'ramda'
import chai from 'chai'
import sinon from 'sinon'
import Bacon from 'baconjs'
import React from 'react'
import Common from './utils/common-util'
import { render, shallow } from 'enzyme'
import { createComponent } from './component'
import { getActionStream } from './dispatcher'
import { createStore } from './store'

const createPluggable = (log) => () => {
  const stream = new Bacon.Bus()
  return {
    input: stream,
    output: stream
      .doAction(log)
  }
}

describe('Component', () => {

  let sandbox

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  it('should create a react component', () => {
    const Test = createComponent(R.F)
    chai.expect(React.Component.isPrototypeOf(Test)).to.be.true
  })

  it('should keep the component name', () => {
    const Test = createComponent(class Test extends React.Component {})
    chai.expect(Test.displayName).to.equal('Test')
  })

  it('should set the default component name', () => {
    const Test = createComponent(R.F)
    chai.expect(Test.displayName).to.equal('Component')
  })

  it('should keep the component name from displayName', () => {
    const Test = createComponent(createComponent(class Test extends React.Component {}))
    chai.expect(Test.displayName).to.equal('Test')
  })

  it('should have no default props', () => {
    const Test = createComponent(R.F)
    chai.expect(Test.defaultProps).to.eql({})
  })

  it('should have no default state', () => {
    const Test = createComponent(R.F)
    const wrapper = shallow(<Test />)
    chai.expect(wrapper.state()).to.eql({})
  })

  it('should create dispose function', () => {
    const Test = createComponent(R.F)
    const wrapper = shallow(<Test />)
    chai.expect(wrapper.instance()).to.have.property('dispose')
      .and.is.a('function')
  })

  it('should render a div', () => {
    const Test = createComponent(() => (<div />))
    const wrapper = render(<Test />)
    chai.expect(wrapper.find('div')).to.have.length(1)
  })

  it('should proxy props to the underlying component', () => {
    const Test = createComponent(({ className }) => (<div className={ className } />))
    const wrapper = render(<Test className={ 'test' } />)
    chai.expect(wrapper.find('div.test')).to.have.length(1)
  })

  it('should subscribe to a store', () => {
    sandbox.stub(Common, 'isOnServer')
      .returns(false)

    const logReduce = sinon.stub()
    const Test = createComponent(R.F, {
      test: createStore('name', createPluggable(logReduce))
    })

    shallow(<Test />)
    getActionStream().push({})
    chai.expect(logReduce.calledOnce).to.be.true
  })

  it('should unsubscribe from a store', () => {
    sandbox.stub(Common, 'isOnServer')
      .returns(true)

    const logReduce = sinon.stub()
    const Test = createComponent(R.F, {
      test: createStore('name', createPluggable(logReduce))
    })

    shallow(<Test />)
    getActionStream().push({})
    chai.expect(logReduce.called).to.be.false
  })

  it('should trigger a single callback after subscription', () => {
    const callback = sinon.stub()
    const Test = createComponent(R.F, {
      test: createStore('name', createPluggable())
    }, callback)

    shallow(<Test />)
    chai.expect(callback.calledOnce).to.be.true
    chai.expect(callback.lastCall.args[0]).to.eql({
      test: null
    })
  })

  it('should trigger multiple callbacks after subscription', () => {
    const callback1 = sinon.stub()
    const callback2 = sinon.stub()
    const Test = createComponent(R.F, {
      test: createStore('name', createPluggable())
    },
    callback1,
    callback2)

    shallow(<Test />)
    chai.expect(callback1.calledOnce).to.be.true
    chai.expect(callback2.calledOnce).to.be.true
    chai.expect(callback2.lastCall.args[0]).to.eql({
      test: null
    })
  })

  afterEach(() => {
    sandbox.restore()
  })

})

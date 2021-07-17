import { shallowMount } from '@vue/test-utils'
//import { mount } from '@vue/test-utils'
import Converter from '@/views/Converter.vue'
// import { main } from '@/views/Converter.vue'
//import flushPromises from 'flush-promises'
//import { getUnit } from '@/services/ConverterService.js'

/* jest.mock('@/services/ConverterService.js')
beforeEach(() => {
  jest.clearAllMocks()
}) */

const inOut = [
  [
    {
      in: '1 000 000',
      expectedOutRemoveWhiteSpaces: '1000000',
      expectedOutRemoveRedundantZeros: '1000000',
    },
  ],
]
describe('Converter: removeWhitespaces()', () => {
  /*  it('should test if the function is called', async () => {
    const wrapper = shallowMount(Converter)
    const testInput = '1 000 000'
    await flushPromises()
    console.log(`Enter removeWhiteSpaces ${testInput}`)
    expect(wrapper.vm.removeWhiteSpaces(testInput)).toBeCalledTimes(1)
  }) */
  it('displays the expected call stack implementation with a test input and shows how each function transforms the input', () => {
    const wrapper = shallowMount(Converter)
    const outRemoveWhiteSpaces = wrapper.vm.removeWhiteSpaces(inOut[0][0].in)
    const outRemoveRedundantZeros = wrapper.vm.removeRedundantZeros(
      outRemoveWhiteSpaces
    )
    console.log(
      `Enter removeWhiteSpaces in: ${inOut[0][0].in} out: ${outRemoveWhiteSpaces}`
    )
    expect(outRemoveWhiteSpaces).toMatch(
      inOut[0][0].expectedOutRemoveWhiteSpaces
    )
    console.log(
      `Enter RemoveRedundantZeros in: ${outRemoveWhiteSpaces} out: ${outRemoveRedundantZeros}`
    )
    expect(outRemoveRedundantZeros).toMatch(
      inOut[0][0].expectedOutRemoveRedundantZeros
    )
  })
})

/* describe('Converter: removeRedundantZeros ', () => {
  it('test if in floating point input', () => {
    const wrapper = shallowMount(Converter)
    expect(wrapper.vm.removeRedundantZeros(inOut[0][0].in)).toMatch(
      inOut[0][0].removeRedundantZerosOut
    )
  })
})
 */

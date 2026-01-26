import { calculateTaxes, getCalculationRulesExplanation } from '../calculations'
import { FiscalCondition } from '@/lib/types/supplier'
import { DocumentType } from '@/lib/types/expense'

describe('calculations', () => {
  describe('calculateTaxes', () => {
    it('returns zeros when no fiscal condition', () => {
      const result = calculateTaxes(1000, null, 'invoice_a')
      expect(result.vat_perception).toBe(0)
      expect(result.vat_withholding).toBe(0)
      expect(result.iibb_perception).toBe(0)
      expect(result.income_tax_withholding).toBe(0)
    })

    it('returns zeros for INVOICE_C document type', () => {
      const result = calculateTaxes(1000, FiscalCondition.RI, 'invoice_c')
      expect(result.vat_perception).toBe(0)
      expect(result.iibb_perception).toBe(0)
    })

    it('returns zeros for VAL document type', () => {
      const result = calculateTaxes(1000, FiscalCondition.RI, 'val')
      expect(result.vat_perception).toBe(0)
      expect(result.iibb_perception).toBe(0)
    })

    it('calculates taxes for RI with INVOICE_A', () => {
      const amount = 1000
      const result = calculateTaxes(amount, FiscalCondition.RI, 'invoice_a')
      
      // VAT perception: 10% of amount
      expect(result.vat_perception).toBe(100)
      // IIBB perception: 3.5% of amount
      expect(result.iibb_perception).toBe(35)
      expect(result.is_auto_calculated).toBe(true)
    })

    it('calculates taxes for RI with INVOICE_B', () => {
      const amount = 1000
      const result = calculateTaxes(amount, FiscalCondition.RI, 'invoice_b')
      
      expect(result.vat_perception).toBe(100)
      expect(result.iibb_perception).toBe(35)
    })

    it('returns zeros for MONOTRIBUTISTA', () => {
      const result = calculateTaxes(1000, FiscalCondition.MONOTRIBUTISTA, 'invoice_a')
      expect(result.vat_perception).toBe(0)
      expect(result.iibb_perception).toBe(0)
    })

    it('returns zeros for EXEMPT', () => {
      const result = calculateTaxes(1000, FiscalCondition.EXEMPT, 'invoice_a')
      expect(result.vat_perception).toBe(0)
      expect(result.iibb_perception).toBe(0)
    })
  })

  describe('getCalculationRulesExplanation', () => {
    it('returns explanation for RI with INVOICE_A', () => {
      const explanation = getCalculationRulesExplanation(FiscalCondition.RI, 'invoice_a')
      expect(explanation).toBeTruthy()
      expect(explanation).toContain('RI')
    })

    it('returns explanation for MONOTRIBUTISTA', () => {
      const explanation = getCalculationRulesExplanation(FiscalCondition.MONOTRIBUTISTA, 'invoice_a')
      expect(explanation).toBeTruthy()
    })
  })
})


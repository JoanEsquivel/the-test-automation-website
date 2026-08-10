// ATDD: tables playground — semantic sortable/paginated table over the 24 seed
// products, plus an editable-cells table that commits on Enter.
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import productsJson from '@seed/products.json'
import { useDifficultyStore } from '@/playground/difficulty'
import TablesPage from '../TablesPage'

interface SeedProduct {
  name: string
  price: number
}

const products = productsJson as SeedProduct[]
const byName = [...products].sort((a, b) => a.name.localeCompare(b.name))
const byPrice = [...products].sort((a, b) => a.price - b.price)

function firstDataRow() {
  const table = screen.getByRole('table', { name: /seed products/i })
  return within(table).getAllByRole('row')[1]
}

beforeEach(() => {
  localStorage.clear()
  useDifficultyStore.setState({ level: 'easy' })
})

describe('TablesPage', () => {
  it('sorts by price and toggles direction on a second click', async () => {
    const user = userEvent.setup()
    render(<TablesPage />)
    // default: sorted by name ascending
    expect(firstDataRow()).toHaveTextContent(byName[0].name)
    await user.click(screen.getByRole('button', { name: /price/i }))
    expect(firstDataRow()).toHaveTextContent(byPrice[0].name)
    await user.click(screen.getByRole('button', { name: /price/i }))
    expect(firstDataRow()).toHaveTextContent(byPrice[byPrice.length - 1].name)
  })

  it('paginates forward and back through the 24 products', async () => {
    const user = userEvent.setup()
    render(<TablesPage />)
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /next page/i }))
    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument()
    expect(firstDataRow()).toHaveTextContent(byName[8].name)
    await user.click(screen.getByRole('button', { name: /previous page/i }))
    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument()
    expect(firstDataRow()).toHaveTextContent(byName[0].name)
  })

  it('commits an edited cell on Enter and logs the edit', async () => {
    const user = userEvent.setup()
    render(<TablesPage />)
    const cell = screen.getByTestId('tables-edit-cell-plugs')
    await user.dblClick(cell)
    const editor = within(cell).getByRole('textbox')
    await user.clear(editor)
    await user.type(editor, '42{Enter}')
    expect(screen.getByTestId('tables-edit-cell-plugs')).toHaveTextContent('42')
    expect(screen.getByTestId('tables-edit-readout')).toHaveTextContent(/spark plugs/i)
    expect(screen.getByTestId('tables-edit-readout')).toHaveTextContent('42')
  })

  it('shows exactly one Recommended badge for the table widget row', () => {
    render(<TablesPage />)
    expect(screen.getAllByText('Recommended')).toHaveLength(1)
  })
})

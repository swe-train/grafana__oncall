import { screen } from '@testing-library/react';

export function queryByTestId<T extends HTMLElement = HTMLElement>(query) {
  return screen.queryByTestId<T>(query);
}

export function getByTestId<T extends HTMLElement = HTMLElement>(query) {
  return screen.getByTestId<T>(query);
}

export function expectToBeDisabled(element: HTMLElement) {
  expect(element.hasAttribute('disabled')).toBeTruthy();
}

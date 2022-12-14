/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import Bills from "../containers/Bills.js";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')

      /*------------Ajout de "expect"----------------*/
      expect(windowIcon.className).toBe("active-icon")
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills }, { formatDate: false })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map(a => a.innerHTML)

      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  // ajout nouveaux test
  describe("When I click on button new-bill", () => {
    test("Then the modal new Bill should open", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const bill = new Bills({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      })

      const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e))
      const buttonNewBill = screen.getAllByTestId("btn-new-bill")
      buttonNewBill.addEventListener("click", handleClickNewBill)
      userEvent.click(buttonNewBill)
      expect(handleClickNewBill).toHaveBeenCalled()
      expect(screen.getAllByAltText("Envoyer une note de frais")).toBeTruthy()
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
    })
  })

  describe("When I click on an icon eye", () => {
    test("A modal should open with bill proof", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = BillsUI({ data: bills })
      $.fn.modal = jest.fn()

      const bill = new Bills({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      })

      const iconEye = screen.getAllByTestId("icon-eye")
      const handleClickIconEye = jest.fn((icon) =>
        bill.handleClickIconEye(icon)
      )
      iconEye.forEach((icon) => {
        icon.addEventListener('click', (e) => handleClickIconEye(icon))
        userEvent.click(icon)
      })

      expect(handleClickIconEye).toHaveBeenCalled()
      expect(screen.getAllByAltText("Justificatif")).toBeTruthy()
    })
  })
})

// test d'intégration GET

describe("Given I am connected as an employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      )
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() =>
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy()
      )
    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock
        })
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        )
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick)
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})

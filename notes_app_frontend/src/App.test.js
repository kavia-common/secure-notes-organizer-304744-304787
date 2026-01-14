import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

test("renders notes home heading", () => {
  render(
    <MemoryRouter initialEntries={["/notes"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/your notes/i)).toBeInTheDocument();
});

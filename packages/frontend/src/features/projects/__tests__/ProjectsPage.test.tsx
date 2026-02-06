import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import ProjectsPage from "../ProjectsPage";
import { AuthProvider } from "../../../contexts/AuthContext";

// Mock dependencies
vi.mock("../hooks/useProjects", () => ({
  useProjects: () => ({
    projects: [
      {
        id: "1",
        name: "Test Project",
        color: "#6366f1",
        memberCount: 1,
        taskCount: 0,
        role: "OWNER",
      },
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    createProject: vi.fn(),
    deleteProject: vi.fn(),
  }),
}));

describe("ProjectsPage", () => {
  it("renders project list", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProjectsPage />
        </AuthProvider>
      </BrowserRouter>,
    );

    expect(screen.getByText("Projelerim")).toBeInTheDocument();
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });
});

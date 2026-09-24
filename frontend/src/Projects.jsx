import axios from 'axios'
import { useEffect, useState } from 'react';
import API from "./config/api";
import ProjectCard from './reusable/ProjectCard';
import { deriveAuthRuntimeState } from './authRuntime';

const Projects = ({ systemToggle }) => {
  const url = API + "/api/projects";
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      const token = localStorage.getItem("token");
      const authRuntime = deriveAuthRuntimeState(systemToggle.auth, token);

      if (!authRuntime.authKnown) {
        return;
      }

      if (!authRuntime.canRequestProjects) {
        setProjects([]);
        setMessage("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(url, {
          signal: controller.signal,
          headers: token
            ? { 'Authorization': "Bearer " + token }
            : undefined
        });

        setProjects(Array.isArray(response.data.data) ? response.data.data : []);
        setMessage(response.data.success === false ? response.data.message : "");
      } catch (error) {
        if (error.code === "ERR_CANCELED") return;

        if (error.response?.status === 401 && systemToggle.auth) {
          localStorage.removeItem("token");
          window.location.reload();
          return;
        }

        console.error(error.message);
        setMessage("Something went wrong while reading the live project API.");
        setProjects([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => controller.abort();
  }, [url, systemToggle.auth, systemToggle.db]);

  return (
    <section className="MainProject" aria-labelledby="core-projects-title">
      <div className="SectionShell">
        <div className="ProjectHead">
          <p className="SectionKicker">Live data path</p>
          <h2 id="core-projects-title">Core Projects</h2>
          <p>
            This section is fetched through the backend and reflects database, authentication, caching, logging, and pagination behavior. The rate-limit flag remains configuration-only because its middleware is not mounted on this route.
          </p>
        </div>

        {loading ? (
          <div className="ProjectLoading" role="status">Reading the project API…</div>
        ) : message ? (
          <div className="ProjectMessage" role="status">
            <span>API response</span>
            <p>{message}</p>
          </div>
        ) : (
          <div className="ProjectCards">
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Projects

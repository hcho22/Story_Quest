import os
import yaml
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI
from crewai_tools import SerperDevTool

load_dotenv()

# --- YAML Helpers ---
def load_yaml(path):
    with open(path, "r") as f:
        return yaml.safe_load(f)

# --- Agent Loader ---
def load_agents(path, llm):
    raw = load_yaml(path)
    agents = {}
    for name, config in raw.items():
        agents[name] = Agent(
            role=config["role"],
            goal=config["goal"],
            backstory=config["backstory"],
            llm=llm,
            tools=[SerperDevTool()],
            verbose=True
        )
    return agents

# --- Task Loader ---
def load_tasks(path, agents):
    raw = load_yaml(path)
    tasks = []
    for name, config in raw.items():
        tasks.append(Task(
            description=config["description"],
            expected_output=config["expected_output"],
            agent=agents[config["agent"]],
        ))
    return tasks

# --- Full Crew Builder ---
def build_full_crew():
    base = os.path.dirname(__file__)
    config_dir = os.path.join(base, "config")
    agents_path = os.path.join(config_dir, "agents.yaml")
    tasks_path = os.path.join(config_dir, "tasks.yaml")

    llm = ChatOpenAI(
        model="gpt-4-turbo",
        temperature=0.7,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

    agents = load_agents(agents_path, llm)
    tasks = load_tasks(tasks_path, agents)

    return Crew(
        agents=list(agents.values()),
        tasks=tasks,
        process=Process.sequential,
        verbose=True
    )

# --- Prompt-only Crew Builder ---
def build_prompt_only_crew():
    base = os.path.dirname(__file__)
    config_dir = os.path.join(base, "config")
    agents_path = os.path.join(config_dir, "agents.yaml")

    llm = ChatOpenAI(
        model="gpt-4-turbo",
        temperature=0.7,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

    agents = load_agents(agents_path, llm)
    creative_writer = agents["creative_writer"]

    prompt_task = Task(
        description="""
        Start a story with a short, imaginative opening (2–3 sentences) tailored to the selected genre ({genre}) 
        and grade level ({grade_level}). It should:
        - Introduce a character or situation
        - Match tone and vocabulary for {grade_level}
        - Clearly reflect the selected genre ({genre})
        """,
        expected_output="A 2–3 sentence story starter matching the student's selected genre and grade level.",
        agent=creative_writer
    )

    return Crew(
        agents=[creative_writer],
        tasks=[prompt_task],
        process=Process.sequential,
        verbose=True
    )

def build_continue_only_crew():
    import os
    from crewai import Agent, Task, Crew
    from langchain_openai import ChatOpenAI
    from crewai_tools import SerperDevTool
    import yaml

    # Load LLM
    llm = ChatOpenAI(
        model="gpt-4-turbo",
        temperature=0.7,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

    # Load agents from YAML
    config_dir = os.path.join(os.path.dirname(__file__), "config")
    with open(os.path.join(config_dir, "agents.yaml"), "r") as f:
        agents_config = yaml.safe_load(f)

    story_partner = Agent(
        role=agents_config["story_partner"]["role"],
        goal=agents_config["story_partner"]["goal"],
        backstory=agents_config["story_partner"]["backstory"],
        llm=llm,
        tools=[SerperDevTool()],
        verbose=True
    )

    # Define task with dynamic formatting handled during kickoff
    continue_task = Task(
        description="""
        Continue the following story using the same characters, setting, and tone.
        
        --- STORY SO FAR ---
        {story_so_far}
        --------------------

        You must:
        - Match the style and voice of the student's writing.
        - Continue from where the student left off.
        - Use the same characters (do NOT introduce new characters or scenes).
        - Keep the tone and genre consistent with what the student wrote.
        - Write only 2–3 new sentences that move the story forward.

        Do not restart, summarize, analyze, or change the story setting.
        """,
        expected_output="2–3 sentences that continue the story naturally.",
        agent=story_partner
    )

    return Crew(
        agents=[story_partner],
        tasks=[continue_task],
        verbose=True
    )


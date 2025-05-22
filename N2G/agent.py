from crewai import Crew, Task, Process

from N2G.agent import (
    story_partner_agent,
    creativity_evaluator_agent,
    prompt_generator_agent,
    scaffolding_agent,
    content_moderator_agent,
    progress_tracker_agent
)

def build_crew():
    # Define tasks
    generate_prompt_task = Task(
        description=(
            "Create a story starter or plot twist for the student based on the grade level and selected genre. "
            "Include an engaging situation that fits the student's developmental stage."
        ),
        expected_output=(
            "A 1-2 sentence story starter or challenge prompt tailored to the student's grade level and selected genre."
        ),
        agent=prompt_generator_agent
    )

    continue_story_task = Task(
        description=(
            "Read the student's story so far and add a contextually relevant continuation. "
            "Make sure to match tone, character consistency, and narrative logic."
        ),
        expected_output=(
            "A 2-3 sentence continuation of the story that fits the style and content already provided."
        ),
        agent=story_partner_agent
    )

    provide_feedback_task = Task(
        description=(
            "Evaluate the student's latest story addition for creativity, narrative coherence, and use of literary techniques. "
            "Offer praise, constructive comments, and one suggestion to improve or deepen the story."
        ),
        expected_output=(
            "A paragraph of feedback with 1-2 compliments and 1 suggestion for improvement."
        ),
        agent=creativity_evaluator_agent
    )

    give_scaffolding_task = Task(
        description=(
            "If the student appears stuck or asks for help, offer a hint, sentence starter, or suggestion based on the story context."
        ),
        expected_output=(
            "One relevant and grade-appropriate hint or suggestion that helps the student continue writing."
        ),
        agent=scaffolding_agent
    )

    moderate_content_task = Task(
        description=(
            "Review the student and AI-generated content for safety and grade-appropriateness. "
            "Flag any inappropriate words or topics and provide a cleaned-up version if needed."
        ),
        expected_output=(
            "A status message (Safe/Flagged) and cleaned version of content if flagged."
        ),
        agent=content_moderator_agent
    )

    track_progress_task = Task(
        description=(
            "Analyze the student’s recent contributions and challenges completed. "
            "Recommend a story genre, skill area, or type of challenge to try next."
        ),
        expected_output=(
            "A recommendation for the next story genre or challenge type, along with a short reasoning based on student progress."
        ),
        agent=progress_tracker_agent
    )

    # Assemble the crew
    crew = Crew(
        agents=[
            prompt_generator_agent,
            story_partner_agent,
            creativity_evaluator_agent,
            scaffolding_agent,
            content_moderator_agent,
            progress_tracker_agent
        ],
        tasks=[
            generate_prompt_task,
            continue_story_task,
            provide_feedback_task,
            give_scaffolding_task,
            moderate_content_task,
            track_progress_task
        ],
        process=Process.sequential,
        verbose=True
    )

    return crew

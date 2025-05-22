from crew import build_crew

# Define a wrapper function to trigger the full pipeline
def kickoff(grade_level: str, genre: str, story_so_far: str = "") -> str:
    """
    Launch the collaborative story building process.
    
    Parameters:
    - grade_level (str): Grade level of the student (e.g., 'K-2', '3-5', '6-8', '9-12')
    - genre (str): Genre of the story (e.g., 'fantasy', 'adventure', 'sci-fi')
    - story_so_far (str): Student's story text so far (optional)
    
    Returns:
    - str: Combined output of all agent contributions
    """
    crew = build_crew()
    
    inputs = {
        "grade_level": grade_level,
        "genre": genre,
        "story_so_far": story_so_far
    }

    result = crew.kickoff(inputs=inputs)
    return result


# For standalone CLI testing
if __name__ == "__main__":
    print("✨ Starting collaborative story game...\n")
    grade_level = input("Enter grade level (K-2, 3-5, 6-8, 9-12): ")
    genre = input("Enter genre (fantasy, adventure, sci-fi, etc.): ")
    story_so_far = input("Paste your story so far (or leave blank to generate from scratch): ")

    output = kickoff(grade_level, genre, story_so_far)
    print("\n🎉 Final Output:\n")
    print(output)

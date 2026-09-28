"""Read the adjacent student.json using Python's standard library.

Run: python inspect_json.py
Objects become dicts; arrays become lists. Array indexes start at zero.
"""
import json
from pathlib import Path


def main():
    filename = Path(__file__).with_name("student.json")
    with filename.open(encoding="utf-8") as source:
        data = json.load(source)

    student = data["student"]
    print("Name:", student["name"])
    print("First course:", student["courses"][0])
    print("City:", student["address"]["city"])
    print("Active:", student["active"])
    print("Advisor:", student["advisor"])
    for index, course in enumerate(student["courses"]):
        print(f"Course {index}: {course}")


if __name__ == "__main__":
    main()

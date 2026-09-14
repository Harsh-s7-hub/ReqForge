import os


def process_image(image_path):
    """
    Process an image or diagram for multimodal documentation generation.
    """

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")

    supported_formats = [".png", ".jpg", ".jpeg", ".webp"]

    file_extension = os.path.splitext(image_path)[1].lower()

    if file_extension not in supported_formats:
        raise ValueError(
            f"Unsupported image format: {file_extension}"
        )

    image_info = {
        "image_path": image_path,
        "file_type": file_extension,
        "file_name": os.path.basename(image_path)
    }

    return image_info


if __name__ == "__main__":

    image_path = "knowledge_base/images/test.png"

    try:
        result = process_image(image_path)

        print("Image processed successfully:")
        print("File:", result["file_name"])
        print("Type:", result["file_type"])
        print("Path:", result["image_path"])

    except (FileNotFoundError, ValueError) as error:
        print("Error:", error)
